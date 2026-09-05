-- Lifecycle of a stored response: edit, soft delete, restore, and the purge that ends it.
--
-- Everything here runs as `authenticated` with a JWT claim, so the row level security policies
-- are actually exercised rather than merely inspected.

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;

SELECT plan(25);

SELECT has_column('public', 'rsvp_responses', 'updated_at', 'updated_at column exists');
SELECT has_column('public', 'rsvp_responses', 'deleted_at', 'deleted_at column exists');
SELECT has_column('public', 'rsvp_responses', 'deleted_by', 'deleted_by column exists');
SELECT has_column('public', 'rsvp_responses', 'identity_key', 'identity_key column exists');

SELECT hasnt_column(
    'public', 'rsvp_responses', 'retained_until',
    'retained_until is gone: retention is keyed on the wedding date, not on a per-row column'
);

-- One UPDATE policy, not two. Two permissive policies on the same command combine with OR, so
-- the second one never restricted anything.
SELECT results_eq(
    $$SELECT count(*) FROM pg_policies
      WHERE schemaname = 'public' AND tablename = 'rsvp_responses' AND cmd = 'UPDATE'$$,
    ARRAY[1::bigint],
    'Exactly one UPDATE policy governs rsvp_responses'
);

SELECT ok(
    EXISTS (SELECT 1 FROM pg_policies
            WHERE schemaname = 'public' AND tablename = 'rsvp_responses'
              AND policyname = 'rsvp_responses_select_admin' AND cmd = 'SELECT'),
    'Admin RSVP select policy exists'
);

INSERT INTO auth.users (id)
VALUES ('10000000-0000-0000-0000-000000000001'),
       ('20000000-0000-0000-0000-000000000002');

INSERT INTO public.invitations (wedding_slug, event_date_utc)
VALUES ('test-invitation-a', now() + interval '60 days'),
       ('test-invitation-b', now() + interval '60 days');

INSERT INTO public.invitation_admins (invitation_id, user_id)
VALUES ('test-invitation-a', '10000000-0000-0000-0000-000000000001'),
       ('test-invitation-b', '20000000-0000-0000-0000-000000000002');

INSERT INTO public.rsvp_responses (wedding_slug, full_name, attending, message)
VALUES ('test-invitation-a', 'Invitada A', true, 'Mensaje A'),
       ('test-invitation-b', 'Invitado B', false, 'Mensaje B');

SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claim.sub = '10000000-0000-0000-0000-000000000001';

SELECT results_eq(
    'SELECT count(*) FROM public.rsvp_responses',
    ARRAY[1::bigint],
    'Admin A sees only own invitation before lifecycle checks'
);

UPDATE public.rsvp_responses
SET message = 'Mensaje A editado', full_name = 'Invitada A editada'
WHERE wedding_slug = 'test-invitation-a' AND full_name = 'Invitada A';

SELECT results_eq(
    $$SELECT full_name, message FROM public.rsvp_responses WHERE wedding_slug = 'test-invitation-a'$$,
    $$SELECT 'Invitada A editada'::text, 'Mensaje A editado'::text$$,
    'Admin A can edit own invitation fields'
);

SELECT throws_ok(
$$
    UPDATE public.rsvp_responses
    SET wedding_slug = 'test-invitation-b'
    WHERE wedding_slug = 'test-invitation-a'
      AND full_name = 'Invitada A editada'
$$, '42501', NULL, 'Admin A cannot move a response to another wedding');

-- Deletion authorship belongs to the database. An admin who sends someone else's id gets their
-- own recorded, because a client must not choose whose name the record carries.
UPDATE public.rsvp_responses
SET deleted_at = now(), deleted_by = '20000000-0000-0000-0000-000000000002'
WHERE wedding_slug = 'test-invitation-a' AND full_name = 'Invitada A editada';

SET LOCAL ROLE postgres;
SELECT results_eq(
    $$SELECT deleted_by FROM public.rsvp_responses WHERE wedding_slug = 'test-invitation-a'$$,
    ARRAY['10000000-0000-0000-0000-000000000001'::uuid],
    'The deletion is stamped with the admin who ran it, not the id they sent'
);

SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claim.sub = '10000000-0000-0000-0000-000000000001';

SELECT results_eq(
    $$SELECT count(*) FROM public.rsvp_responses WHERE wedding_slug = 'test-invitation-a' AND deleted_at IS NULL$$,
    ARRAY[0::bigint],
    'Soft-deleted rows are hidden from admin reads'
);

SET LOCAL request.jwt.claim.sub = '20000000-0000-0000-0000-000000000002';

SELECT results_eq(
    $$SELECT count(*) FROM public.rsvp_responses WHERE wedding_slug = 'test-invitation-a'$$,
    ARRAY[0::bigint],
    'Admin B never sees invitation A, deleted or not'
);

SET LOCAL request.jwt.claim.sub = '10000000-0000-0000-0000-000000000001';

UPDATE public.rsvp_responses
SET deleted_at = NULL
WHERE wedding_slug = 'test-invitation-a' AND full_name = 'Invitada A editada';

SELECT results_eq(
    $$SELECT count(*) FROM public.rsvp_responses WHERE wedding_slug = 'test-invitation-a' AND deleted_at IS NULL$$,
    ARRAY[1::bigint],
    'Admin A can restore a deleted row'
);

SET LOCAL ROLE postgres;
SELECT results_eq(
    $$SELECT deleted_by FROM public.rsvp_responses WHERE wedding_slug = 'test-invitation-a'$$,
    ARRAY[NULL::uuid],
    'Restoring clears the deletion authorship'
);

-- The legacy flat columns are derived from `answers` on every write, so no client can
-- desynchronise the two.
UPDATE public.rsvp_responses
SET answers = '{"fullName": "Invitada A definitiva", "attending": false, "dietaryOptions": ["gluten"]}'::jsonb
WHERE wedding_slug = 'test-invitation-a';

SELECT results_eq(
    $$SELECT full_name, attending, dietary_options FROM public.rsvp_responses WHERE wedding_slug = 'test-invitation-a'$$,
    $$SELECT 'Invitada A definitiva'::text, false, ARRAY['gluten']::text[]$$,
    'An update to answers re-derives the flat columns'
);

-- A repeat submission corrects the existing row rather than adding a second one, and matches on
-- a normalised name so trailing spaces and casing do not create a duplicate.
INSERT INTO public.rsvp_responses (wedding_slug, full_name, attending, form_id, form_version, locale, answers)
VALUES ('test-invitation-a', 'ignored', true, 'wedding-rsvp', 2, 'es',
        '{"fullName": "  invitada a DEFINITIVA ", "attending": true}'::jsonb);

SELECT results_eq(
    $$SELECT count(*) FROM public.rsvp_responses WHERE wedding_slug = 'test-invitation-a'$$,
    ARRAY[1::bigint],
    'A repeat submission corrects the existing row instead of duplicating it'
);

SELECT results_eq(
    $$SELECT attending FROM public.rsvp_responses WHERE wedding_slug = 'test-invitation-a'$$,
    ARRAY[true],
    'The correction overwrites the previous answer'
);

-- Purge: keyed on the wedding date, reaching every response of an expired wedding rather than
-- only the ones an admin happened to delete by hand.
SELECT ok(
    to_regprocedure('public.purge_expired_rsvp(text)') IS NULL,
    'The old per-wedding purge function is gone'
);

SELECT ok(
    has_function_privilege('service_role', 'public.purge_all_expired_rsvp()', 'EXECUTE'),
    'service_role can execute the purge'
);

SELECT ok(
    NOT has_function_privilege('authenticated', 'public.purge_all_expired_rsvp()', 'EXECUTE'),
    'authenticated cannot execute the purge'
);

SELECT public.purge_all_expired_rsvp();

SELECT results_eq(
    'SELECT count(*) FROM public.rsvp_responses',
    ARRAY[2::bigint],
    'The purge spares weddings that have not happened yet'
);

UPDATE public.invitations SET event_date_utc = now() - interval '8 days' WHERE wedding_slug = 'test-invitation-a';
SELECT public.purge_all_expired_rsvp();

SELECT results_eq(
    $$SELECT count(*) FROM public.rsvp_responses WHERE wedding_slug = 'test-invitation-a'$$,
    ARRAY[0::bigint],
    'The purge deletes every response of a wedding eight days past, deleted by hand or not'
);

SELECT results_eq(
    $$SELECT count(*) FROM public.rsvp_responses WHERE wedding_slug = 'test-invitation-b'$$,
    ARRAY[1::bigint],
    'The purge leaves other weddings untouched'
);

SELECT ok(
    EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'purge-expired-rsvp-daily'),
    'The purge runs nightly without anyone opening the admin panel'
);

SELECT * FROM finish();
ROLLBACK;

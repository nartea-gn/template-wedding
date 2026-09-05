-- Who can read, write and execute what.
--
-- Every assertion that matters runs as `anon` or `authenticated` with a JWT claim, so the
-- policies and grants are exercised rather than merely listed. Inspecting `pg_policies` proves a
-- policy exists; it does not prove it does anything.

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;

SELECT plan(21);

SELECT has_table('public', 'rsvp_responses', 'RSVP responses table exists');
SELECT has_table('public', 'invitation_admins', 'Invitation memberships table exists');
SELECT has_table('public', 'invitations', 'Invitation calendar table exists');

SELECT ok(
    (SELECT relrowsecurity FROM pg_class WHERE oid = 'public.rsvp_responses'::regclass),
    'RLS is enabled on RSVP responses'
);
SELECT ok(
    (SELECT relrowsecurity FROM pg_class WHERE oid = 'public.invitation_admins'::regclass),
    'RLS is enabled on invitation memberships'
);
SELECT ok(
    (SELECT relrowsecurity FROM pg_class WHERE oid = 'public.invitations'::regclass),
    'RLS is enabled on the invitation calendar'
);

SELECT ok(
    NOT has_table_privilege('anon', 'public.rsvp_responses', 'SELECT'),
    'Anonymous users cannot select RSVP responses'
);
SELECT ok(
    NOT has_table_privilege('authenticated', 'public.rsvp_responses', 'INSERT'),
    'Authenticated users do not inherit the public submission privilege'
);
SELECT ok(
    NOT has_table_privilege('anon', 'public.invitations', 'SELECT'),
    'Anonymous users cannot read the invitation calendar directly'
);

-- SECURITY DEFINER functions must name the roles they revoke from. Supabase's default privileges
-- grant EXECUTE on every new function in `public` to anon and authenticated, and a direct grant
-- survives a REVOKE ... FROM PUBLIC.
SELECT ok(
    NOT has_function_privilege('anon', 'public.get_pending_purge_warnings(int)', 'EXECUTE'),
    'Anonymous users cannot harvest administrator email addresses'
);
SELECT ok(
    NOT has_function_privilege('authenticated', 'public.get_pending_purge_warnings(int)', 'EXECUTE'),
    'Authenticated users cannot harvest administrator email addresses'
);
SELECT ok(
    NOT has_function_privilege('anon', 'public.purge_all_expired_rsvp()', 'EXECUTE'),
    'Anonymous users cannot trigger the purge'
);
SELECT ok(
    has_function_privilege('anon', 'public.get_rsvp_status(text)', 'EXECUTE'),
    'Anonymous users can read the RSVP status, which is what the invitation needs'
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

INSERT INTO public.rsvp_responses (wedding_slug, full_name, attending)
VALUES ('test-invitation-a', 'Invitada A', true),
       ('test-invitation-b', 'Invitado B', false);

-- Guest side: the RSVP closes at the API, not only in the interface.
SET LOCAL ROLE anon;

INSERT INTO public.rsvp_responses (wedding_slug, full_name, attending, form_id, form_version, locale, answers)
VALUES ('test-invitation-a', 'Invitado Puntual', true, 'wedding-rsvp', 2, 'es',
        '{"fullName": "Invitado Puntual", "attending": true}'::jsonb);

SELECT pass('An anonymous guest can submit while the RSVP is open');

SELECT throws_ok(
$$
    INSERT INTO public.rsvp_responses (wedding_slug, full_name, attending, form_id, form_version, locale, answers)
    VALUES ('unregistered-wedding', 'Desconocido', true, 'wedding-rsvp', 2, 'es',
            '{"fullName": "Desconocido", "attending": true}'::jsonb)
$$, '42501', NULL, 'An unregistered wedding fails closed rather than open');

SET LOCAL ROLE postgres;
UPDATE public.invitations SET rsvp_override = 'closed' WHERE wedding_slug = 'test-invitation-a';
SET LOCAL ROLE anon;

SELECT throws_ok(
$$
    INSERT INTO public.rsvp_responses (wedding_slug, full_name, attending, form_id, form_version, locale, answers)
    VALUES ('test-invitation-a', 'Invitado Tardio', true, 'wedding-rsvp', 2, 'es',
            '{"fullName": "Invitado Tardio", "attending": true}'::jsonb)
$$, '42501', NULL, 'The API rejects a submission once the couple closes the RSVP');

-- Admin side: partitioned by membership, in both directions.
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claim.sub = '10000000-0000-0000-0000-000000000001';

SELECT results_eq(
    'SELECT DISTINCT wedding_slug FROM public.rsvp_responses',
    ARRAY['test-invitation-a'::text],
    'Admin A sees only invitation A'
);

SELECT results_eq(
    'SELECT wedding_slug FROM public.invitations',
    ARRAY['test-invitation-a'::text],
    'Admin A sees only their own calendar row'
);

-- The couple owns the schedule; they must not be able to move the wedding date itself.
SELECT throws_ok(
$$
    UPDATE public.invitations SET event_date_utc = now() + interval '1 day'
    WHERE wedding_slug = 'test-invitation-a'
$$, '42501', NULL, 'An admin cannot rewrite the wedding date from the panel');

UPDATE public.invitations SET rsvp_override = 'open' WHERE wedding_slug = 'test-invitation-a';
SELECT pass('An admin can reopen the RSVP from the panel');

SET LOCAL request.jwt.claim.sub = '30000000-0000-0000-0000-000000000003';

SELECT results_eq(
    'SELECT count(*) FROM public.rsvp_responses',
    ARRAY[0::bigint],
    'An authenticated user without membership sees nothing'
);

SELECT * FROM finish();
ROLLBACK;

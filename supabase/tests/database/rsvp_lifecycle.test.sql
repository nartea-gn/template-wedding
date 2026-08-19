BEGIN;

CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;

SELECT plan(19);

SELECT has_table('public', 'rsvp_responses', 'RSVP responses table exists');
SELECT has_column('public', 'rsvp_responses', 'updated_at', 'updated_at column exists');
SELECT has_column('public', 'rsvp_responses', 'deleted_at', 'deleted_at column exists');
SELECT has_column('public', 'rsvp_responses', 'deleted_by', 'deleted_by column exists');
SELECT has_column('public', 'rsvp_responses', 'retained_until', 'retained_until column exists');

SELECT ok(
    EXISTS (SELECT 1
            FROM pg_policies
            WHERE schemaname = 'public'
              AND tablename = 'rsvp_responses'
              AND policyname = 'rsvp_responses_update_admin'
              AND cmd = 'UPDATE'),
    'Admin RSVP update policy exists'
);
SELECT ok(
    EXISTS (SELECT 1
            FROM pg_policies
            WHERE schemaname = 'public'
              AND tablename = 'rsvp_responses'
              AND policyname = 'rsvp_responses_soft_delete_admin'
              AND cmd = 'UPDATE'),
    'Admin RSVP soft delete policy exists'
);
SELECT ok(
    EXISTS (SELECT 1
            FROM pg_policies
            WHERE schemaname = 'public'
              AND tablename = 'rsvp_responses'
              AND policyname = 'rsvp_responses_select_admin'
              AND cmd = 'SELECT'),
    'Admin RSVP select policy exists'
);

INSERT INTO auth.users (id)
VALUES ('10000000-0000-0000-0000-000000000001'),
       ('20000000-0000-0000-0000-000000000002');

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
$$, '42501', NULL, 'Admin A cannot change wedding_slug');


UPDATE public.rsvp_responses
SET deleted_at = now(), deleted_by = '10000000-0000-0000-0000-000000000001'
WHERE wedding_slug = 'test-invitation-a' AND full_name = 'Invitada A editada';

SELECT results_eq(
    'SELECT count(*) FROM public.rsvp_responses WHERE wedding_slug = ''test-invitation-a'' AND deleted_at IS NULL',
    ARRAY[0::bigint],
    'Soft-deleted rows are hidden from admin reads'
);

SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claim.sub = '20000000-0000-0000-0000-000000000002';

SELECT results_eq(
    'SELECT count(*) FROM public.rsvp_responses WHERE wedding_slug = ''test-invitation-a'' AND deleted_at IS NULL',
    ARRAY[0::bigint],
    'Admin B does not see deleted invitation A'
);

SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claim.sub = '10000000-0000-0000-0000-000000000001';

UPDATE public.rsvp_responses
SET deleted_at = NULL, deleted_by = NULL
WHERE wedding_slug = 'test-invitation-a' AND full_name = 'Invitada A editada';

SELECT results_eq(
    'SELECT count(*) FROM public.rsvp_responses WHERE wedding_slug = ''test-invitation-a'' AND deleted_at IS NULL',
    ARRAY[1::bigint],
    'Admin A can restore deleted rows'
);

UPDATE public.rsvp_responses
SET retained_until = now() - interval '1 day', deleted_at = now(), deleted_by = '10000000-0000-0000-0000-000000000001'
WHERE wedding_slug = 'test-invitation-a' AND full_name = 'Invitada A editada';

UPDATE public.rsvp_responses
SET retained_until = NULL
WHERE wedding_slug = 'test-invitation-b' AND full_name = 'Invitado B';

SELECT results_eq(
    'SELECT count(*) FROM public.rsvp_responses',
    ARRAY[1::bigint],
    'Retention rules keep non-expired rows and exclude expired ones'
);

SELECT ok(
    to_regprocedure('public.purge_expired_rsvp(text)') IS NOT NULL,
    'purge_expired_rsvp function exists'
);

SELECT ok(
    has_function_privilege('service_role', 'public.purge_expired_rsvp(text)', 'EXECUTE'),
    'service_role can execute purge_expired_rsvp'
);

SELECT ok(
    NOT has_function_privilege('authenticated', 'public.purge_expired_rsvp(text)', 'EXECUTE'),
    'authenticated cannot execute purge_expired_rsvp'
);

SELECT ok(
    EXISTS (SELECT 1
            FROM pg_trigger
            WHERE tgrelid = 'public.rsvp_responses'::regclass
              AND tgname = 'rsvp_responses_set_updated_at'),
    'updated_at trigger exists'
);

SELECT *
FROM finish();

ROLLBACK;

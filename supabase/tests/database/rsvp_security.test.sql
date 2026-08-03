BEGIN;

CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;

SELECT plan(15);

SELECT has_table('public', 'rsvp_responses', 'RSVP responses table exists');
SELECT has_table('public', 'invitation_admins', 'Invitation memberships table exists');

SELECT ok(
    (SELECT relrowsecurity FROM pg_class WHERE oid = 'public.rsvp_responses'::regclass),
    'RLS is enabled on RSVP responses'
);
SELECT ok(
    (SELECT relrowsecurity FROM pg_class WHERE oid = 'public.invitation_admins'::regclass),
    'RLS is enabled on invitation memberships'
);

SELECT ok(
    EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'rsvp_responses'
          AND policyname = 'rsvp_responses_insert_anon'
          AND cmd = 'INSERT'
    ),
    'Anonymous RSVP insert policy exists'
);
SELECT ok(
    EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'rsvp_responses'
          AND policyname = 'rsvp_responses_select_admin'
          AND cmd = 'SELECT'
    ),
    'Authenticated RSVP read policy exists'
);
SELECT ok(
    EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'invitation_admins'
          AND policyname = 'invitation_admins_select_own'
          AND cmd = 'SELECT'
    ),
    'Own-membership read policy exists'
);

SELECT ok(
    NOT has_table_privilege('anon', 'public.rsvp_responses', 'SELECT'),
    'Anonymous users cannot select RSVP responses'
);
SELECT ok(
    has_any_column_privilege('anon', 'public.rsvp_responses', 'INSERT'),
    'Anonymous users can insert only through the granted RSVP columns'
);
SELECT ok(
    has_table_privilege('authenticated', 'public.rsvp_responses', 'SELECT'),
    'Authenticated users can request authorized RSVP reads'
);
SELECT ok(
    NOT has_table_privilege('authenticated', 'public.rsvp_responses', 'INSERT'),
    'Authenticated users do not inherit the public submission privilege'
);

INSERT INTO auth.users (id)
VALUES
    ('10000000-0000-0000-0000-000000000001'),
    ('20000000-0000-0000-0000-000000000002');

INSERT INTO public.invitation_admins (invitation_id, user_id)
VALUES
    ('test-invitation-a', '10000000-0000-0000-0000-000000000001'),
    ('test-invitation-b', '20000000-0000-0000-0000-000000000002');

INSERT INTO public.rsvp_responses (wedding_slug, full_name, attending)
VALUES
    ('test-invitation-a', 'Invitada A', true),
    ('test-invitation-b', 'Invitado B', false);

SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claim.sub = '10000000-0000-0000-0000-000000000001';

SELECT results_eq(
    'SELECT count(*) FROM public.rsvp_responses',
    ARRAY[1::bigint],
    'Admin A sees exactly one invitation'
);
SELECT results_eq(
    'SELECT wedding_slug FROM public.rsvp_responses',
    ARRAY['test-invitation-a'::text],
    'Admin A sees only invitation A'
);

SET LOCAL request.jwt.claim.sub = '20000000-0000-0000-0000-000000000002';

SELECT results_eq(
    'SELECT wedding_slug FROM public.rsvp_responses',
    ARRAY['test-invitation-b'::text],
    'Admin B sees only invitation B'
);

SET LOCAL request.jwt.claim.sub = '30000000-0000-0000-0000-000000000003';

SELECT results_eq(
    'SELECT count(*) FROM public.rsvp_responses',
    ARRAY[0::bigint],
    'An authenticated user without membership sees no invitations'
);

SELECT * FROM finish();
ROLLBACK;

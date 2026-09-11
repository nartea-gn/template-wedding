-- The RSVP closure has to hold on the correction path, not only on the first submission.
--
-- `20260904_prevent_duplicate_rsvp.sql` redirects a repeat submission onto the existing row with
-- a BEFORE INSERT trigger that returns NULL, and returning NULL cancels the tuple before the
-- `WITH CHECK` of `rsvp_responses_insert_anon` is evaluated. Every assertion below runs as `anon`
-- against a closed RSVP, because inspecting the policy proves the clause is written; it does not
-- prove the clause is reached.

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;

SELECT plan(12);

SELECT has_function('public', 'require_rsvp_open', 'The closure gate exists as a function');
SELECT ok(
    NOT has_function_privilege('anon', 'public.require_rsvp_open()', 'EXECUTE'),
    'Anonymous users cannot call the closure gate directly'
);

INSERT INTO auth.users (id)
VALUES ('a0000000-0000-0000-0000-00000000000a');

INSERT INTO public.invitations (wedding_slug, event_date_utc)
VALUES ('closure-open', now() + interval '60 days'),
       ('closure-shut', now() + interval '60 days');

INSERT INTO public.invitation_admins (invitation_id, user_id)
VALUES ('closure-shut', 'a0000000-0000-0000-0000-00000000000a');

-- ---------------------------------------------------------------------------------------------
-- While the RSVP is open, a repeat submission still corrects the existing row rather than
-- creating a second one. The fix must not cost the behaviour 20260904 was written for.
-- ---------------------------------------------------------------------------------------------

SET LOCAL ROLE anon;
SET LOCAL request.jwt.claim.sub = '';

INSERT INTO public.rsvp_responses (wedding_slug, full_name, attending, form_id, form_version, locale, answers)
VALUES ('closure-open', 'Ana Lopez', true, 'wedding-rsvp', 2, 'es',
        '{"fullName": "Ana Lopez", "attending": true}'::jsonb);

-- `submission_intent` since 20260911: the guest says they are the same person, because the name
-- on its own does not distinguish a correction from a second guest who shares it.
INSERT INTO public.rsvp_responses (wedding_slug, full_name, attending, form_id, form_version, locale, answers, submission_intent)
VALUES ('closure-open', '  ana lopez  ', false, 'wedding-rsvp', 2, 'es',
        '{"fullName": "  ana lopez  ", "attending": false}'::jsonb, 'correction');

SELECT pass('A correction is accepted while the RSVP is open');

SET LOCAL ROLE postgres;

SELECT results_eq(
    $$SELECT count(*) FROM public.rsvp_responses
      WHERE wedding_slug = 'closure-open' AND deleted_at IS NULL$$,
    ARRAY[1::bigint],
    'The correction reuses the row instead of duplicating the guest'
);

SELECT results_eq(
    $$SELECT (answers ->> 'attending')::boolean FROM public.rsvp_responses
      WHERE wedding_slug = 'closure-open' AND deleted_at IS NULL$$,
    ARRAY[false],
    'The correction is the answer that survives'
);

-- The trail must not read the guest's own correction as an administrator's edit.
SELECT results_eq(
    $$SELECT action, actor_id FROM public.admin_audit
      WHERE wedding_slug = 'closure-open'$$,
    $$VALUES ('corrected'::text, NULL::uuid)$$,
    'An anonymous correction is recorded as corrected, not as updated'
);

-- ---------------------------------------------------------------------------------------------
-- Once the couple closes it, both paths have to refuse -- and say which reason applies.
-- ---------------------------------------------------------------------------------------------

INSERT INTO public.rsvp_responses (wedding_slug, full_name, attending, form_id, form_version, locale, answers)
VALUES ('closure-shut', 'Bruno Diaz', true, 'wedding-rsvp', 2, 'es',
        '{"fullName": "Bruno Diaz", "attending": true}'::jsonb);

UPDATE public.invitations SET rsvp_override = 'closed' WHERE wedding_slug = 'closure-shut';

SET LOCAL ROLE anon;
SET LOCAL request.jwt.claim.sub = '';

-- This is the bypass, measured: before the fix it returned `INSERT 0 0` with no error and
-- rewrote `attending`.
SELECT throws_ok(
$$
    INSERT INTO public.rsvp_responses (wedding_slug, full_name, attending, form_id, form_version, locale, answers)
    VALUES ('closure-shut', 'Bruno Diaz', false, 'wedding-rsvp', 2, 'es',
            '{"fullName": "Bruno Diaz", "attending": false}'::jsonb)
$$, 'RSVPC', NULL, 'A closed RSVP refuses a correction to an existing row');

SELECT throws_ok(
$$
    INSERT INTO public.rsvp_responses (wedding_slug, full_name, attending, form_id, form_version, locale, answers)
    VALUES ('closure-shut', 'Carla Ruiz', true, 'wedding-rsvp', 2, 'es',
            '{"fullName": "Carla Ruiz", "attending": true}'::jsonb)
$$, 'RSVPC', NULL, 'A closed RSVP refuses a first-time submission with the same code');

-- A slug nobody registered is a deployment problem. Reporting it as a passed deadline sent every
-- guest to the closed page with no way to retry.
SELECT throws_ok(
$$
    INSERT INTO public.rsvp_responses (wedding_slug, full_name, attending, form_id, form_version, locale, answers)
    VALUES ('never-synced', 'Dario Sanz', true, 'wedding-rsvp', 2, 'es',
            '{"fullName": "Dario Sanz", "attending": true}'::jsonb)
$$, 'RSVPU', NULL, 'An unregistered wedding is distinguishable from a closed one');

SET LOCAL ROLE postgres;

SELECT results_eq(
    $$SELECT (answers ->> 'attending')::boolean FROM public.rsvp_responses
      WHERE wedding_slug = 'closure-shut' AND deleted_at IS NULL$$,
    ARRAY[true],
    'The refused correction left the stored answer untouched'
);

-- ---------------------------------------------------------------------------------------------
-- The panel needs the persisted override, not just the effective state.
-- ---------------------------------------------------------------------------------------------

SELECT results_eq(
    $$SELECT is_open, override FROM public.get_rsvp_status('closure-shut')$$,
    $$VALUES (false, 'closed'::text)$$,
    'get_rsvp_status reports the manual override the panel has to render'
);

SELECT results_eq(
    $$SELECT is_open, override FROM public.get_rsvp_status('closure-open')$$,
    $$VALUES (true, NULL::text)$$,
    'An automatic schedule reports a NULL override rather than inventing one'
);

SELECT * FROM finish();
ROLLBACK;

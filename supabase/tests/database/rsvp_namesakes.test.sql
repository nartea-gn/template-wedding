-- Two guests who share a name must end up as two guests.
--
-- Until 20260911 the second Ana López to answer overwrote the first: identity was
-- `lower(btrim(full_name))` and a repeat submission was redirected onto the existing row without
-- anyone being asked. Every assertion below runs as `anon` through a plain INSERT, which is the
-- only path a guest has, because reading the trigger proves what it intends and not what the
-- privileges and the policy let through.

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;

SELECT plan(14);

SELECT has_function('public', 'resolve_rsvp_identity', 'The identity resolver exists as a function');
SELECT ok(
    NOT has_function_privilege('anon', 'public.resolve_rsvp_identity()', 'EXECUTE'),
    'Anonymous users cannot call the identity resolver directly'
);

-- The discriminator is the trigger's alone. Granting it would let a guest aim their row at a
-- specific namesake slot, which is the failure this migration exists to prevent.
SELECT ok(
    NOT has_column_privilege('anon', 'public.rsvp_responses', 'identity_discriminator', 'INSERT'),
    'Anonymous users cannot write the discriminator that separates namesakes'
);
SELECT ok(
    has_column_privilege('anon', 'public.rsvp_responses', 'submission_intent', 'INSERT'),
    'Anonymous users can state their intent, which is the whole mechanism'
);

INSERT INTO public.invitations (wedding_slug, event_date_utc)
VALUES ('namesakes', now() + interval '60 days');

SET LOCAL ROLE anon;
SET LOCAL request.jwt.claim.sub = '';

INSERT INTO public.rsvp_responses (wedding_slug, full_name, attending, form_id, form_version, locale, answers)
VALUES ('namesakes', 'Ana Lopez', true, 'wedding-rsvp', 2, 'es',
        '{"fullName": "Ana Lopez", "attending": true, "songRequest": "la primera"}'::jsonb);

-- THE BUG, MEASURED: this used to succeed and silently rewrite the row above.
SELECT throws_ok(
$$
    INSERT INTO public.rsvp_responses (wedding_slug, full_name, attending, form_id, form_version, locale, answers)
    VALUES ('namesakes', 'ana lopez', false, 'wedding-rsvp', 2, 'es',
            '{"fullName": "ana lopez", "attending": false}'::jsonb)
$$, 'RSVPD', NULL, 'A name that already answered is refused until the guest says which case it is');

SET LOCAL ROLE postgres;
SELECT results_eq(
    $$SELECT (answers ->> 'songRequest') FROM public.rsvp_responses WHERE wedding_slug = 'namesakes'$$,
    ARRAY['la primera'],
    'The refused submission left the first guest untouched'
);
SET LOCAL ROLE anon;

-- A second person who shares the name gets their own row.
INSERT INTO public.rsvp_responses (wedding_slug, full_name, attending, form_id, form_version, locale, answers, submission_intent)
VALUES ('namesakes', 'Ana Lopez', false, 'wedding-rsvp', 2, 'es',
        '{"fullName": "Ana Lopez", "attending": false, "songRequest": "la segunda"}'::jsonb, 'namesake');

SET LOCAL ROLE postgres;

SELECT results_eq(
    $$SELECT count(*) FROM public.rsvp_responses WHERE wedding_slug = 'namesakes' AND deleted_at IS NULL$$,
    ARRAY[2::bigint],
    'The namesake is a second guest, not an edit of the first'
);

SELECT results_eq(
    $$SELECT identity_key FROM public.rsvp_responses
      WHERE wedding_slug = 'namesakes' ORDER BY id$$,
    $$VALUES ('ana lopez'::text), ('ana lopez#2'::text)$$,
    'The discriminator is what lets the unique index hold both'
);

SELECT results_eq(
    $$SELECT (answers ->> 'songRequest') FROM public.rsvp_responses
      WHERE wedding_slug = 'namesakes' ORDER BY id$$,
    $$VALUES ('la primera'::text), ('la segunda'::text)$$,
    'Each guest keeps the answer they sent'
);

-- The request is not a fact about the guest, and is not kept.
SELECT is_empty(
    $$SELECT id FROM public.rsvp_responses
      WHERE wedding_slug = 'namesakes' AND submission_intent IS NOT NULL$$,
    'The intent is cleared before the row is stored'
);

SET LOCAL ROLE anon;

-- With two holders of the name, no correction can be attributed to either. This is exactly the
-- moment the old behaviour overwrote a stranger.
SELECT throws_ok(
$$
    INSERT INTO public.rsvp_responses (wedding_slug, full_name, attending, form_id, form_version, locale, answers, submission_intent)
    VALUES ('namesakes', 'Ana Lopez', true, 'wedding-rsvp', 2, 'es',
            '{"fullName": "Ana Lopez", "attending": true}'::jsonb, 'correction')
$$, 'RSVPM', NULL, 'An ambiguous correction is refused rather than guessed');

-- A name nobody has answered under is a first submission, whatever the guest claims: someone who
-- mistyped their name once and came back must not be told the form is confused.
INSERT INTO public.rsvp_responses (wedding_slug, full_name, attending, form_id, form_version, locale, answers, submission_intent)
VALUES ('namesakes', 'Bruno Diaz', true, 'wedding-rsvp', 2, 'es',
        '{"fullName": "Bruno Diaz", "attending": true}'::jsonb, 'namesake');

SET LOCAL ROLE postgres;

SELECT is(
    (SELECT identity_discriminator FROM public.rsvp_responses
     WHERE wedding_slug = 'namesakes' AND full_name = 'Bruno Diaz'),
    NULL::smallint,
    'The first holder of a name carries no discriminator, whatever they asked for'
);

SET LOCAL ROLE anon;

-- And a lone holder correcting their own answer still works, which is the path most guests take.
INSERT INTO public.rsvp_responses (wedding_slug, full_name, attending, form_id, form_version, locale, answers, submission_intent)
VALUES ('namesakes', '  bruno diaz  ', false, 'wedding-rsvp', 2, 'es',
        '{"fullName": "  bruno diaz  ", "attending": false}'::jsonb, 'correction');

SET LOCAL ROLE postgres;

SELECT results_eq(
    $$SELECT count(*) FROM public.rsvp_responses
      WHERE wedding_slug = 'namesakes' AND lower(btrim(full_name)) = 'bruno diaz' AND deleted_at IS NULL$$,
    ARRAY[1::bigint],
    'A correction from the only holder of a name still reuses the row'
);

SELECT results_eq(
    $$SELECT action FROM public.admin_audit WHERE wedding_slug = 'namesakes'$$,
    $$VALUES ('corrected'::text)$$,
    'That correction is still recorded as the guest''s own, not as an administrator''s edit'
);

SELECT * FROM finish();
ROLLBACK;

-- Sprint 7.1: enforce least-privilege RSVP access and per-invitation Admin authorization.

CREATE TABLE public.invitation_admins
(
    invitation_id TEXT        NOT NULL,
    user_id       UUID        NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT invitation_admins_pkey PRIMARY KEY (invitation_id, user_id),
    CONSTRAINT invitation_admins_invitation_id_check
        CHECK (char_length(btrim(invitation_id)) BETWEEN 1 AND 100)
);

ALTER TABLE public.rsvp_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitation_admins ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.rsvp_responses
    ADD CONSTRAINT rsvp_responses_wedding_slug_check
        CHECK (char_length(btrim(wedding_slug)) BETWEEN 1 AND 100) NOT VALID,
    ADD CONSTRAINT rsvp_responses_full_name_check
        CHECK (char_length(btrim(full_name)) BETWEEN 1 AND 200) NOT VALID,
    ADD CONSTRAINT rsvp_responses_dietary_options_check
        CHECK (cardinality(dietary_options) <= 16 AND octet_length(dietary_options::text) <= 2000) NOT VALID,
    ADD CONSTRAINT rsvp_responses_dietary_other_check
        CHECK (dietary_other IS NULL OR char_length(dietary_other) <= 1000) NOT VALID,
    ADD CONSTRAINT rsvp_responses_bus_option_check
        CHECK (bus_option IS NULL OR char_length(bus_option) <= 100) NOT VALID,
    ADD CONSTRAINT rsvp_responses_song_request_check
        CHECK (song_request IS NULL OR char_length(song_request) <= 500) NOT VALID,
    ADD CONSTRAINT rsvp_responses_message_check
        CHECK (message IS NULL OR char_length(message) <= 4000) NOT VALID,
    ADD CONSTRAINT rsvp_responses_form_id_check
        CHECK (form_id IS NULL OR char_length(btrim(form_id)) BETWEEN 1 AND 100) NOT VALID,
    ADD CONSTRAINT rsvp_responses_form_version_check
        CHECK (form_version IS NULL OR form_version >= 1) NOT VALID,
    ADD CONSTRAINT rsvp_responses_locale_check
        CHECK (locale IS NULL OR char_length(locale) BETWEEN 2 AND 35) NOT VALID,
    ADD CONSTRAINT rsvp_responses_answers_check
        CHECK (
            answers IS NULL
            OR (
                jsonb_typeof(answers) = 'object'
                AND octet_length(answers::text) <= 16384
            )
        ) NOT VALID;

ALTER TABLE public.rsvp_responses VALIDATE CONSTRAINT rsvp_responses_wedding_slug_check;
ALTER TABLE public.rsvp_responses VALIDATE CONSTRAINT rsvp_responses_full_name_check;
ALTER TABLE public.rsvp_responses VALIDATE CONSTRAINT rsvp_responses_dietary_options_check;
ALTER TABLE public.rsvp_responses VALIDATE CONSTRAINT rsvp_responses_dietary_other_check;
ALTER TABLE public.rsvp_responses VALIDATE CONSTRAINT rsvp_responses_bus_option_check;
ALTER TABLE public.rsvp_responses VALIDATE CONSTRAINT rsvp_responses_song_request_check;
ALTER TABLE public.rsvp_responses VALIDATE CONSTRAINT rsvp_responses_message_check;
ALTER TABLE public.rsvp_responses VALIDATE CONSTRAINT rsvp_responses_form_id_check;
ALTER TABLE public.rsvp_responses VALIDATE CONSTRAINT rsvp_responses_form_version_check;
ALTER TABLE public.rsvp_responses VALIDATE CONSTRAINT rsvp_responses_locale_check;
ALTER TABLE public.rsvp_responses VALIDATE CONSTRAINT rsvp_responses_answers_check;

DO
$$
DECLARE
existing_policy RECORD;
BEGIN
FOR existing_policy IN
SELECT policyname
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'rsvp_responses'
  AND 'anon' = ANY (roles)
  AND cmd IN ('SELECT', 'INSERT') LOOP
        EXECUTE format(
            'DROP POLICY %I ON public.rsvp_responses',
            existing_policy.policyname
        );
END LOOP;
END
$$;

DROP
POLICY IF EXISTS rsvp_responses_select_admin ON public.rsvp_responses;
DROP
POLICY IF EXISTS invitation_admins_select_own ON public.invitation_admins;

CREATE
POLICY rsvp_responses_insert_anon
    ON public.rsvp_responses
    FOR INSERT
    TO anon
    WITH CHECK (
        char_length(btrim(wedding_slug)) BETWEEN 1 AND 100
        AND char_length(btrim(full_name)) BETWEEN 1 AND 200
        AND cardinality(dietary_options) <= 16
        AND octet_length(dietary_options::text) <= 2000
        AND form_id IS NOT NULL
        AND char_length(btrim(form_id)) BETWEEN 1 AND 100
        AND form_version IS NOT NULL
        AND form_version >= 1
        AND locale IS NOT NULL
        AND char_length(locale) BETWEEN 2 AND 35
        AND answers IS NOT NULL
        AND jsonb_typeof(answers) = 'object'
        AND octet_length(answers::text) <= 16384
        AND answers ? 'fullName'
        AND answers ? 'attending'
        AND answers ->> 'fullName' = full_name
        AND answers -> 'attending' = to_jsonb(attending)
    );

CREATE
POLICY invitation_admins_select_own
    ON public.invitation_admins
    FOR
SELECT
    TO authenticated
    USING (user_id = (SELECT auth.uid()));

CREATE
POLICY rsvp_responses_select_admin
    ON public.rsvp_responses
    FOR
SELECT
    TO authenticated
    USING (
    EXISTS (
    SELECT 1
    FROM public.invitation_admins AS membership
    WHERE membership.invitation_id = rsvp_responses.wedding_slug
    AND membership.user_id = (SELECT auth.uid())
    )
    );

REVOKE ALL ON TABLE public.rsvp_responses FROM anon, authenticated;
GRANT INSERT (
              wedding_slug,
              full_name,
              attending,
              dietary_options,
              dietary_other,
              bus_option,
              song_request,
              message,
              form_id,
              form_version,
              locale,
              answers
    ) ON TABLE public.rsvp_responses TO anon;
GRANT SELECT ON TABLE public.rsvp_responses TO authenticated;

REVOKE ALL ON TABLE public.invitation_admins FROM anon, authenticated;
GRANT SELECT ON TABLE public.invitation_admins TO authenticated;
GRANT
ALL
ON TABLE public.invitation_admins TO service_role;

REVOKE ALL ON SEQUENCE public.rsvp_responses_id_seq FROM anon, authenticated;
GRANT USAGE ON SEQUENCE public.rsvp_responses_id_seq TO anon;
GRANT
ALL
ON SEQUENCE public.rsvp_responses_id_seq TO service_role;

GRANT ALL
ON TABLE public.rsvp_responses TO service_role;

DO
$$
BEGIN
    IF
to_regprocedure('public.rls_auto_enable()') IS NOT NULL THEN
        EXECUTE 'REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM PUBLIC, anon, authenticated';
END IF;
END
$$;

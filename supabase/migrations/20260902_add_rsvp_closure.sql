-- Review §12.1 and §12.1.1: close the RSVP at the API, not only in the interface.
--
-- Until now the deadline lived in the static invitation config and was compared against the
-- browser clock. `rsvp_responses_insert_anon` had no date clause at all, so with the public
-- anon key any HTTP client could keep inserting after the deadline, after the wedding, or a
-- year later. The deadline and the manual open/closed switch are calendar metadata of the same
-- kind as `event_date_utc`, so they extend the `invitations` table of §8.1 rather than
-- creating a second one.
--
-- Requires 20260901_add_invitations_purge.sql.

ALTER TABLE public.invitations
    ADD COLUMN IF NOT EXISTS rsvp_deadline_utc TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS rsvp_override TEXT;

ALTER TABLE public.invitations
    DROP CONSTRAINT IF EXISTS invitations_rsvp_override_check;
ALTER TABLE public.invitations
    ADD CONSTRAINT invitations_rsvp_override_check
    CHECK (rsvp_override IS NULL OR rsvp_override IN ('open', 'closed'));

-- Default: 14 days before the wedding, only when nobody has set one already. A column DEFAULT
-- cannot reference another column of the same row in Postgres, hence a BEFORE INSERT trigger.
CREATE OR REPLACE FUNCTION public.default_rsvp_deadline()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.rsvp_deadline_utc IS NULL THEN
        NEW.rsvp_deadline_utc := NEW.event_date_utc - INTERVAL '14 days';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER SET search_path = public;

DROP TRIGGER IF EXISTS invitations_default_rsvp_deadline ON public.invitations;
CREATE TRIGGER invitations_default_rsvp_deadline
    BEFORE INSERT ON public.invitations
    FOR EACH ROW EXECUTE FUNCTION public.default_rsvp_deadline();

-- Effective state: the manual override always beats the computed deadline. NULL means
-- "automatic, follow the deadline". SECURITY DEFINER because `anon` must be able to evaluate
-- it without holding any privilege on the table.
CREATE OR REPLACE FUNCTION public.is_rsvp_open(p_wedding_slug TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT CASE inv.rsvp_override
        WHEN 'open' THEN true
        WHEN 'closed' THEN false
        ELSE now() < inv.rsvp_deadline_utc
    END
    FROM public.invitations AS inv
    WHERE inv.wedding_slug = p_wedding_slug;
$$;

REVOKE ALL ON FUNCTION public.is_rsvp_open(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_rsvp_open(TEXT) TO anon, authenticated;

-- The client needs the deadline as well as the state: the rsvp-cta section shows it and the
-- closed page can quote it. One function returns both, in one round trip, exposing exactly two
-- scalars instead of opening a SELECT over a table that will keep gaining columns.
CREATE OR REPLACE FUNCTION public.get_rsvp_status(p_wedding_slug TEXT)
RETURNS TABLE (is_open BOOLEAN, deadline_utc TIMESTAMPTZ)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT public.is_rsvp_open(inv.wedding_slug), inv.rsvp_deadline_utc
    FROM public.invitations AS inv
    WHERE inv.wedding_slug = p_wedding_slug;
$$;

REVOKE ALL ON FUNCTION public.get_rsvp_status(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_rsvp_status(TEXT) TO anon, authenticated;

-- The authority that actually closes the RSVP. Recreated in full because a policy's WITH CHECK
-- cannot be altered in place. If the slug is missing from `invitations`, `is_rsvp_open` returns
-- NULL and the insert is rejected: it fails closed, which is the correct default here.
DROP POLICY IF EXISTS rsvp_responses_insert_anon ON public.rsvp_responses;
CREATE POLICY rsvp_responses_insert_anon
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
        AND public.is_rsvp_open(wedding_slug)
    );

-- Protected write, limited to the two scheduling columns. The column-list GRANT is belt and
-- braces next to the policy: even with a tampered payload, Postgres refuses any attempt to
-- touch `event_date_utc` or `wedding_slug` at the privilege level.
DROP POLICY IF EXISTS invitations_update_admin ON public.invitations;
CREATE POLICY invitations_update_admin
    ON public.invitations
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.invitation_admins AS membership
            WHERE membership.invitation_id = invitations.wedding_slug
              AND membership.user_id = (SELECT auth.uid())
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.invitation_admins AS membership
            WHERE membership.invitation_id = invitations.wedding_slug
              AND membership.user_id = (SELECT auth.uid())
        )
    );

GRANT UPDATE (rsvp_deadline_utc, rsvp_override) ON public.invitations TO authenticated;

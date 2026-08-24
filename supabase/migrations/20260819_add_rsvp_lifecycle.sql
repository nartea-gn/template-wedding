-- Sprint 7.1D: RSVP lifecycle metadata, retention, soft delete and admin mutation policies.

ALTER TABLE public.rsvp_responses
    ADD COLUMN IF NOT EXISTS updated_at     TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS deleted_at     TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS deleted_by     UUID,
    ADD COLUMN IF NOT EXISTS retained_until TIMESTAMPTZ;

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS rsvp_responses_set_updated_at ON public.rsvp_responses;
CREATE TRIGGER rsvp_responses_set_updated_at
    BEFORE UPDATE ON public.rsvp_responses
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

CREATE POLICY rsvp_responses_update_admin
    ON public.rsvp_responses
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM public.invitation_admins AS membership
            WHERE membership.invitation_id = rsvp_responses.wedding_slug
              AND membership.user_id = (SELECT auth.uid())
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM public.invitation_admins AS membership
            WHERE membership.invitation_id = rsvp_responses.wedding_slug
              AND membership.user_id = (SELECT auth.uid())
        )
    );

CREATE POLICY rsvp_responses_soft_delete_admin
    ON public.rsvp_responses
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM public.invitation_admins AS membership
            WHERE membership.invitation_id = rsvp_responses.wedding_slug
              AND membership.user_id = (SELECT auth.uid())
        )
        AND rsvp_responses.deleted_at IS NULL
    )
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM public.invitation_admins AS membership
            WHERE membership.invitation_id = rsvp_responses.wedding_slug
              AND membership.user_id = (SELECT auth.uid())
        )
        AND deleted_at IS NOT NULL
        AND deleted_by = (SELECT auth.uid())
    );

CREATE OR REPLACE FUNCTION public.purge_expired_rsvp(p_wedding_slug TEXT)
RETURNS VOID AS $$
BEGIN
    DELETE FROM public.rsvp_responses
    WHERE wedding_slug = p_wedding_slug
      AND deleted_at IS NOT NULL
      AND retained_until IS NOT NULL
      AND retained_until < now();
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public;

REVOKE ALL ON FUNCTION public.purge_expired_rsvp(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.purge_expired_rsvp(TEXT) TO service_role;

GRANT UPDATE (
    updated_at, deleted_at, deleted_by, retained_until,
    answers, full_name, attending, dietary_options,
    dietary_other, bus_option, song_request, message, locale
) ON public.rsvp_responses TO authenticated;

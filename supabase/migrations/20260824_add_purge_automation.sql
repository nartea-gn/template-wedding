-- Sprint 7.1D gap: automate expired RSVP retention purge.
-- Exposes a membership-checked wrapper so authenticated admins can trigger purge
-- from the app, while keeping the underlying SECURITY DEFINER function restricted
-- to service_role only.

CREATE OR REPLACE FUNCTION public.purge_expired_rsvp_public(p_wedding_slug TEXT)
RETURNS VOID AS $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM public.invitation_admins AS membership
        WHERE membership.invitation_id = p_wedding_slug
          AND membership.user_id = (SELECT auth.uid())
    ) THEN
        PERFORM public.purge_expired_rsvp(p_wedding_slug);
    END IF;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public;

REVOKE ALL ON FUNCTION public.purge_expired_rsvp_public(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.purge_expired_rsvp_public(TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION public.purge_all_expired_rsvp()
RETURNS VOID AS $$
DECLARE
    row_record RECORD;
BEGIN
    FOR row_record IN
        SELECT DISTINCT wedding_slug
        FROM public.rsvp_responses
        WHERE deleted_at IS NOT NULL
          AND retained_until IS NOT NULL
          AND retained_until < now()
    LOOP
        PERFORM public.purge_expired_rsvp(row_record.wedding_slug);
    END LOOP;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public;

REVOKE ALL ON FUNCTION public.purge_all_expired_rsvp() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.purge_all_expired_rsvp() TO service_role;

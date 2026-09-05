-- Review §8.1: real retention purge, driven by the wedding date and a cron job.
--
-- Two failures had the same root cause: the database did not know when the wedding was.
--   1. `purge_expired_rsvp` only deleted rows with `deleted_at IS NOT NULL`, so a response the
--      admin never removed by hand was never purged, no matter how much time passed.
--   2. The purge only ran when an admin opened the panel. Nobody opens it after the wedding.
--
-- The wedding date becomes a database column, populated by the deploy pipeline
-- (scripts/sync-invitation.ts), and a nightly cron job purges without anyone logging in.

-- Source of truth for the wedding date, in UTC. One row per wedding_slug, written by the
-- deploy pipeline with the service role, never by the browser at runtime.
CREATE TABLE IF NOT EXISTS public.invitations (
    wedding_slug   TEXT PRIMARY KEY,
    event_date_utc TIMESTAMPTZ NOT NULL,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- Only the admin team of that wedding can read its date, so the panel can show when the
-- responses will be purged. Writing is reserved to service_role.
DROP POLICY IF EXISTS invitations_select_admin ON public.invitations;
CREATE POLICY invitations_select_admin
    ON public.invitations
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.invitation_admins AS membership
            WHERE membership.invitation_id = invitations.wedding_slug
              AND membership.user_id = (SELECT auth.uid())
        )
    );

REVOKE ALL ON TABLE public.invitations FROM anon, authenticated;
GRANT SELECT ON TABLE public.invitations TO authenticated;
GRANT ALL ON TABLE public.invitations TO service_role;

-- Replaces the per-row, admin-marked purge with a whole-wedding purge keyed on the event date.
CREATE OR REPLACE FUNCTION public.purge_all_expired_rsvp()
RETURNS VOID AS $$
BEGIN
    DELETE FROM public.rsvp_responses
    WHERE wedding_slug IN (
        SELECT wedding_slug FROM public.invitations
        WHERE event_date_utc + INTERVAL '7 days' < now()
    );
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public;

-- Revoking from PUBLIC is not enough: Supabase's default privileges grant EXECUTE on every new
-- function in `public` directly to anon and authenticated, and a direct grant survives a PUBLIC
-- revoke. Without naming the roles, any holder of the anon key could trigger this deletion.
REVOKE ALL ON FUNCTION public.purge_all_expired_rsvp() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.purge_all_expired_rsvp() TO service_role;

-- Requires the pg_cron extension (Supabase: Database -> Extensions -> pg_cron).
-- Runs nightly, without depending on anyone opening the admin panel.
SELECT cron.unschedule('purge-expired-rsvp-daily')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'purge-expired-rsvp-daily');

SELECT cron.schedule(
    'purge-expired-rsvp-daily',
    '0 3 * * *',
    $$SELECT public.purge_all_expired_rsvp()$$
);

-- Without this FK a row whose wedding_slug is absent from `invitations` is NEVER purged: the
-- DELETE above only reaches slugs present in that table, and the anonymous INSERT does not
-- check that the slug exists. NOT VALID so historical orphan rows do not block the deploy;
-- validate it with ALTER TABLE ... VALIDATE CONSTRAINT once `invitations` is populated.
ALTER TABLE public.rsvp_responses
    DROP CONSTRAINT IF EXISTS rsvp_responses_wedding_slug_fkey;
ALTER TABLE public.rsvp_responses
    ADD CONSTRAINT rsvp_responses_wedding_slug_fkey
    FOREIGN KEY (wedding_slug) REFERENCES public.invitations (wedding_slug)
    ON DELETE CASCADE
    NOT VALID;

-- Obsolete under the new design: the purge is no longer a client responsibility, and the
-- per-row retention column was never written by any layer of the application.
DROP FUNCTION IF EXISTS public.purge_expired_rsvp_public(TEXT);
DROP FUNCTION IF EXISTS public.purge_expired_rsvp(TEXT);
ALTER TABLE public.rsvp_responses DROP COLUMN IF EXISTS retained_until;

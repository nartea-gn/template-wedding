-- Review §8.4: warn the admins before the irreversible DELETE of §8.1.
--
-- The nightly purge deletes for good. If `event_date_utc` carries a typo, or the couple meant
-- to export the final CSV and did not get to it in time, there is no way back. A pg_cron job
-- calls an Edge Function over HTTP (pg_net), and that function sends the emails through Resend
-- a few days before the cutoff. Each wedding is marked once warned so the mail is not resent
-- every night.
--
-- Requires 20260901_add_invitations_purge.sql, plus the pg_net and pg_cron extensions.

ALTER TABLE public.invitations
    ADD COLUMN IF NOT EXISTS purge_warning_sent_at TIMESTAMPTZ;

-- Returns, for every admin of every wedding about to be purged, their email address.
-- SECURITY DEFINER because it needs to read auth.users, which normal RLS does not expose.
CREATE OR REPLACE FUNCTION public.get_pending_purge_warnings(p_days_before INT)
RETURNS TABLE (wedding_slug TEXT, admin_email TEXT, purge_date TIMESTAMPTZ)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, auth
AS $$
    SELECT i.wedding_slug, u.email, i.event_date_utc + INTERVAL '7 days'
    FROM public.invitations AS i
    JOIN public.invitation_admins AS ia ON ia.invitation_id = i.wedding_slug
    JOIN auth.users AS u ON u.id = ia.user_id
    WHERE i.purge_warning_sent_at IS NULL
      AND i.event_date_utc + INTERVAL '7 days' - (p_days_before || ' days')::interval <= now()
      AND i.event_date_utc + INTERVAL '7 days' > now();
$$;

-- Naming the roles is what actually closes this one. It is SECURITY DEFINER over auth.users and
-- returns administrator email addresses; left on Supabase's default privileges, anybody holding
-- the public anon key could harvest the address of every admin of every expiring wedding.
REVOKE ALL ON FUNCTION public.get_pending_purge_warnings(INT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_pending_purge_warnings(INT) TO service_role;

-- The endpoint and the service role key both come from Vault rather than being written here:
-- a hardcoded project ref breaks on the next project, and a hardcoded key would leak into the
-- repository. Both secrets are created once, by hand, before the first push that carries this
-- migration (see docs/PURGE_DEPLOYMENT.md).
SELECT cron.unschedule('send-purge-warnings-daily')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'send-purge-warnings-daily');

SELECT cron.schedule(
    'send-purge-warnings-daily',
    '0 9 * * *',
    $$
    SELECT net.http_post(
        url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'functions_base_url')
               || '/send-purge-warnings',
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || (
                SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'service_role_key'
            )
        ),
        body := '{}'::jsonb
    )
    $$
);

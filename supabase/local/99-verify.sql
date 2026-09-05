-- Asserts the shape the application code depends on. Fails the container if anything is missing,
-- so a broken migration cannot pass unnoticed.
\set ON_ERROR_STOP on

DO $$
DECLARE
    missing TEXT;
BEGIN
    -- Tables and the columns the repository reads and writes.
    IF to_regclass('public.invitations') IS NULL THEN
        RAISE EXCEPTION 'invitations table is missing';
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_schema = 'public' AND table_name = 'rsvp_responses' AND column_name = 'retained_until') THEN
        RAISE EXCEPTION 'retained_until should have been dropped';
    END IF;
    FOREACH missing IN ARRAY ARRAY['updated_at', 'deleted_at', 'deleted_by', 'answers', 'identity_key'] LOOP
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                       WHERE table_schema = 'public' AND table_name = 'rsvp_responses' AND column_name = missing) THEN
            RAISE EXCEPTION 'rsvp_responses.% is missing', missing;
        END IF;
    END LOOP;

    -- Functions the client and the cron jobs call by name.
    IF to_regclass('public.admin_audit') IS NULL THEN
        RAISE EXCEPTION 'admin_audit table is missing';
    END IF;

    FOREACH missing IN ARRAY ARRAY['is_rsvp_open', 'get_rsvp_status', 'purge_all_expired_rsvp', 'get_pending_purge_warnings'] LOOP
        IF NOT EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
                       WHERE n.nspname = 'public' AND p.proname = missing) THEN
            RAISE EXCEPTION 'function public.% is missing', missing;
        END IF;
    END LOOP;

    -- The obsolete purge entry points must be gone.
    IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
               WHERE n.nspname = 'public' AND p.proname IN ('purge_expired_rsvp', 'purge_expired_rsvp_public')) THEN
        RAISE EXCEPTION 'the old per-wedding purge functions still exist';
    END IF;

    -- Exactly one UPDATE policy on rsvp_responses: two permissive ones combine with OR and the
    -- restrictive intent is lost. This is the regression guard for review 1.2.
    IF (SELECT count(*) FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'rsvp_responses' AND cmd = 'UPDATE') <> 1 THEN
        RAISE EXCEPTION 'expected exactly one UPDATE policy on rsvp_responses';
    END IF;

    -- The anonymous insert must be gated on the RSVP being open.
    IF NOT EXISTS (SELECT 1 FROM pg_policies
                   WHERE schemaname = 'public' AND tablename = 'rsvp_responses'
                     AND policyname = 'rsvp_responses_insert_anon'
                     AND with_check LIKE '%is_rsvp_open%') THEN
        RAISE EXCEPTION 'the anonymous insert policy does not check is_rsvp_open';
    END IF;

    -- Both cron jobs registered.
    IF (SELECT count(*) FROM cron.job WHERE jobname IN ('purge-expired-rsvp-daily', 'send-purge-warnings-daily')) <> 2 THEN
        RAISE EXCEPTION 'expected both nightly cron jobs to be scheduled';
    END IF;

    RAISE NOTICE 'schema verification passed';
END
$$;

-- Behavioural checks: the triggers, not just their presence.
INSERT INTO public.invitations (wedding_slug, event_date_utc)
VALUES ('gala-y-valentin', now() + INTERVAL '60 days');

DO $$
DECLARE
    deadline TIMESTAMPTZ;
BEGIN
    SELECT rsvp_deadline_utc INTO deadline FROM public.invitations WHERE wedding_slug = 'gala-y-valentin';
    IF deadline IS NULL THEN
        RAISE EXCEPTION 'the default RSVP deadline trigger did not fire';
    END IF;
    IF NOT public.is_rsvp_open('gala-y-valentin') THEN
        RAISE EXCEPTION 'a wedding 60 days out should have an open RSVP';
    END IF;
END
$$;

-- The legacy columns are derived from `answers`, not sent by the client.
INSERT INTO public.rsvp_responses (wedding_slug, full_name, attending, form_id, form_version, locale, answers)
VALUES ('gala-y-valentin', 'ignored', false, 'wedding-rsvp', 2, 'es',
        '{"fullName": "Gala García", "attending": true, "dietaryOptions": ["gluten"]}'::jsonb);

DO $$
DECLARE
    row_count INT;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.rsvp_responses
                   WHERE full_name = 'Gala García' AND attending AND dietary_options = ARRAY['gluten']) THEN
        RAISE EXCEPTION 'the legacy column sync trigger did not derive the flat columns';
    END IF;

    -- A repeat submission corrects the existing row instead of adding a second one.
    INSERT INTO public.rsvp_responses (wedding_slug, full_name, attending, form_id, form_version, locale, answers)
    VALUES ('gala-y-valentin', 'ignored', false, 'wedding-rsvp', 2, 'es',
            '{"fullName": "  gala garcía ", "attending": false}'::jsonb);

    SELECT count(*) INTO row_count FROM public.rsvp_responses WHERE wedding_slug = 'gala-y-valentin';
    IF row_count <> 1 THEN
        RAISE EXCEPTION 'a repeat submission created % rows instead of correcting the first', row_count;
    END IF;
    IF (SELECT attending FROM public.rsvp_responses WHERE wedding_slug = 'gala-y-valentin') THEN
        RAISE EXCEPTION 'the correction did not overwrite the previous answer';
    END IF;

    -- The purge only reaches weddings past their retention window.
    PERFORM public.purge_all_expired_rsvp();
    IF NOT EXISTS (SELECT 1 FROM public.rsvp_responses WHERE wedding_slug = 'gala-y-valentin') THEN
        RAISE EXCEPTION 'the purge deleted a wedding that has not happened yet';
    END IF;

    UPDATE public.invitations SET event_date_utc = now() - INTERVAL '8 days' WHERE wedding_slug = 'gala-y-valentin';
    PERFORM public.purge_all_expired_rsvp();
    IF EXISTS (SELECT 1 FROM public.rsvp_responses WHERE wedding_slug = 'gala-y-valentin') THEN
        RAISE EXCEPTION 'the purge did not delete a wedding eight days past';
    END IF;

    -- Moving the wedding date deliberately does NOT recompute the deadline: a redeploy must not
    -- clobber a deadline the couple adjusted from their panel.
    IF NOT public.is_rsvp_open('gala-y-valentin') THEN
        RAISE EXCEPTION 'moving the event date should not have moved the deadline with it';
    END IF;

    -- Past its own deadline, the RSVP closes.
    UPDATE public.invitations SET rsvp_deadline_utc = now() - INTERVAL '1 day'
    WHERE wedding_slug = 'gala-y-valentin';
    IF public.is_rsvp_open('gala-y-valentin') THEN
        RAISE EXCEPTION 'the RSVP should be closed once the deadline has passed';
    END IF;

    -- The manual override beats the deadline in both directions.
    UPDATE public.invitations SET rsvp_override = 'open' WHERE wedding_slug = 'gala-y-valentin';
    IF NOT public.is_rsvp_open('gala-y-valentin') THEN
        RAISE EXCEPTION 'the manual open override was ignored';
    END IF;
    UPDATE public.invitations SET rsvp_override = 'closed', event_date_utc = now() + INTERVAL '60 days'
    WHERE wedding_slug = 'gala-y-valentin';
    IF public.is_rsvp_open('gala-y-valentin') THEN
        RAISE EXCEPTION 'the manual closed override was ignored';
    END IF;

    -- An unknown wedding fails closed rather than open.
    IF public.is_rsvp_open('does-not-exist') IS NOT NULL THEN
        RAISE EXCEPTION 'an unknown wedding should return NULL, which rejects the insert';
    END IF;

    RAISE NOTICE 'behavioural verification passed';
END
$$;

-- The audit trail, and the constraint that governs it: it must not outlive the answers it points
-- at. The purge is a commitment made to the guest in the article 13 notice, so an audit row that
-- survived it would be a retention the guest was never told about.
DO $$
DECLARE
    target BIGINT;
    trail_before INT;
    trail_after INT;
    logged TEXT;
BEGIN
    INSERT INTO public.invitations (wedding_slug, event_date_utc)
    VALUES ('boda-auditoria', now() - INTERVAL '30 days')
    ON CONFLICT (wedding_slug) DO UPDATE SET event_date_utc = EXCLUDED.event_date_utc;

    INSERT INTO public.rsvp_responses (wedding_slug, answers)
    VALUES ('boda-auditoria', '{"fullName": "Invitada Auditada", "attending": true}'::jsonb)
    RETURNING id INTO target;

    -- An anonymous submission is not an administrative mutation and leaves no trail.
    IF (SELECT count(*) FROM public.admin_audit WHERE response_id = target) <> 0 THEN
        RAISE EXCEPTION 'an insert should not be audited';
    END IF;

    UPDATE public.rsvp_responses SET song_request = 'otra cancion' WHERE id = target;
    SELECT action INTO logged FROM public.admin_audit WHERE response_id = target ORDER BY id DESC LIMIT 1;
    IF logged <> 'updated' THEN
        RAISE EXCEPTION 'an edit should be audited as updated, got %', logged;
    END IF;

    -- The action comes from the `deleted_at` transition, so a soft delete cannot pass as an edit.
    UPDATE public.rsvp_responses SET deleted_at = now() WHERE id = target;
    SELECT action INTO logged FROM public.admin_audit WHERE response_id = target ORDER BY id DESC LIMIT 1;
    IF logged <> 'deleted' THEN
        RAISE EXCEPTION 'a soft delete should be audited as deleted, got %', logged;
    END IF;

    UPDATE public.rsvp_responses SET deleted_at = NULL WHERE id = target;
    SELECT action INTO logged FROM public.admin_audit WHERE response_id = target ORDER BY id DESC LIMIT 1;
    IF logged <> 'restored' THEN
        RAISE EXCEPTION 'a restore should be audited as restored, got %', logged;
    END IF;

    -- Changing the deadline is audited against the invitation, with no response attached.
    UPDATE public.invitations SET rsvp_override = 'closed' WHERE wedding_slug = 'boda-auditoria';
    IF NOT EXISTS (SELECT 1 FROM public.admin_audit
                   WHERE wedding_slug = 'boda-auditoria' AND action = 'schedule_changed'
                     AND entity = 'invitation' AND response_id IS NULL) THEN
        RAISE EXCEPTION 'a deadline change should be audited against the invitation';
    END IF;

    SELECT count(*) INTO trail_before FROM public.admin_audit WHERE response_id = target;
    IF trail_before < 3 THEN
        RAISE EXCEPTION 'expected the three mutations in the trail, got %', trail_before;
    END IF;

    PERFORM public.purge_all_expired_rsvp();

    IF EXISTS (SELECT 1 FROM public.rsvp_responses WHERE id = target) THEN
        RAISE EXCEPTION 'the purge should have removed the expired response';
    END IF;

    SELECT count(*) INTO trail_after FROM public.admin_audit WHERE response_id = target;
    IF trail_after <> 0 THEN
        RAISE EXCEPTION 'the audit trail outlived the answers it describes: % rows left', trail_after;
    END IF;

    -- The invitation-level entry has no guest data and is not swept with them.
    IF NOT EXISTS (SELECT 1 FROM public.admin_audit
                   WHERE wedding_slug = 'boda-auditoria' AND action = 'schedule_changed') THEN
        RAISE EXCEPTION 'the schedule entry should survive the purge';
    END IF;

    RAISE NOTICE 'audit trail verification passed';
END
$$;

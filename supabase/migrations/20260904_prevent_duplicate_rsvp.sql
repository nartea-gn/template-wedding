-- Review §10.2: a guest who "goes back in to correct it" created a second row instead.
--
-- `submit()` was a plain INSERT with no uniqueness behind it, so the same person could leave two
-- rows -- one attending, one not -- and nothing flagged it. That is a data integrity problem, not
-- only a UX one: `metrics.attendanceFieldId` feeds the headcount the couple hands to the caterer.
--
-- The review recommends a unique constraint plus an upsert. An upsert from the browser would
-- require granting `anon` UPDATE on the table, which would let anyone overwrite anyone else's
-- answer by guessing their name. Instead the client keeps its plain INSERT and a trigger
-- redirects it onto the existing row, so no new privilege is handed to anonymous callers.
--
-- Requires 20260831_fix_rsvp_update_policies.sql (the trigger that derives `full_name`).

-- Normalised identity: free text typed by a guest, so "Juan Pérez" and "juan perez " must not
-- count as two people.
ALTER TABLE public.rsvp_responses
    ADD COLUMN IF NOT EXISTS identity_key TEXT
    GENERATED ALWAYS AS (lower(btrim(full_name))) STORED;

CREATE UNIQUE INDEX IF NOT EXISTS rsvp_responses_identity_unique
    ON public.rsvp_responses (wedding_slug, identity_key)
    WHERE deleted_at IS NULL;

/*
 * Turns a repeat submission into a correction of the row that already exists.
 *
 * Returning NULL cancels the INSERT, so the guest never creates a duplicate. Runs as the table
 * owner because the anonymous role has no UPDATE privilege and must not be given one.
 *
 * Known limitation: two real guests who share a name share a row. Without a per-guest token
 * there is no stable identifier to tell them apart, so the form warns about it.
 */
CREATE OR REPLACE FUNCTION public.redirect_duplicate_rsvp()
RETURNS TRIGGER AS $$
DECLARE
    existing_id BIGINT;
BEGIN
    SELECT id INTO existing_id
    FROM public.rsvp_responses
    WHERE wedding_slug = NEW.wedding_slug
      AND identity_key = lower(btrim(NEW.full_name))
      AND deleted_at IS NULL;

    IF existing_id IS NULL THEN
        RETURN NEW;
    END IF;

    UPDATE public.rsvp_responses
    SET answers      = NEW.answers,
        form_id      = NEW.form_id,
        form_version = NEW.form_version,
        locale       = NEW.locale
    WHERE id = existing_id;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public;

-- The `20_` prefix puts this after `rsvp_responses_10_sync_legacy_columns`: BEFORE triggers fire
-- in name order, and this one reads `full_name`, which that trigger derives from `answers`.
-- Without the ordering the lookup misses and the unique index rejects the correction instead.
-- A trigger function is not meant to be callable on its own, and this one is SECURITY DEFINER.
REVOKE ALL ON FUNCTION public.redirect_duplicate_rsvp() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS rsvp_responses_redirect_duplicate ON public.rsvp_responses;
DROP TRIGGER IF EXISTS rsvp_responses_20_redirect_duplicate ON public.rsvp_responses;
CREATE TRIGGER rsvp_responses_20_redirect_duplicate
    BEFORE INSERT ON public.rsvp_responses
    FOR EACH ROW EXECUTE FUNCTION public.redirect_duplicate_rsvp();

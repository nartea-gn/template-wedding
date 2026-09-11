-- Two guests who share a name shared a row, and neither of them was told.
--
-- `20260904_prevent_duplicate_rsvp.sql` made identity `lower(btrim(full_name))` per wedding and
-- redirected any repeat submission onto the existing row. Its own header names the consequence:
-- "two real guests who share a name share a row". In a wedding with two Ana López, the second to
-- answer silently overwrote the first -- her menu, her bus seat, her message -- and the form told
-- her the submission had been saved, which it had, over someone else's. The couple then read one
-- row where there were two people, and the headcount handed to the caterer was short by one.
--
-- Nothing here can be inferred from a name alone, so the database stops inferring. A submission
-- that lands on a name already answered is refused, and the guest is asked which of the two
-- things is happening:
--
--   correction  the same person coming back to fix their own answer. The existing row is
--               updated, exactly as before.
--   namesake    a different person who happens to share the name. A new row is created, marked
--               with a discriminator so the unique index accepts it.
--
-- The intent travels on the INSERT rather than through a new RPC: `20260904` avoided granting
-- `anon` any UPDATE privilege, and this keeps the client on the same plain INSERT with the same
-- privileges. It is a request field, not data -- the trigger clears it before the row is stored.
--
-- ERROR CONTRACT -- extends the three codes of 20260907. The client depends on these being
-- distinguishable.
--
--   RSVPD  that name already has an answer and the submission did not say which case it is.
--          The form asks, and resubmits with an intent.
--   RSVPM  a correction arrived for a name that now has several rows, so no single row can be
--          identified. Refused rather than guessed, and the guest is pointed at the couple's
--          address. This is the case that used to be an overwrite.
--
-- Requires 20260904_prevent_duplicate_rsvp.sql and 20260907_enforce_rsvp_closure.sql.


-- ---------------------------------------------------------------------------------------------
-- The mark that lets two identical names coexist under one unique index.
-- ---------------------------------------------------------------------------------------------

/*
 * Never written by the client: the trigger below overwrites whatever arrives, and only it
 * allocates a value. A guest could otherwise pick their own discriminator and land beside
 * someone else's row on purpose.
 */
ALTER TABLE public.rsvp_responses
    ADD COLUMN IF NOT EXISTS identity_discriminator SMALLINT;

COMMENT ON COLUMN public.rsvp_responses.identity_discriminator IS
    'Allocated by resolve_rsvp_identity() for a guest who shares a name with someone who already '
    'answered. NULL for the first holder of a name. Never accepted from the client.';

/*
 * What the guest is asking for when their name is already taken.
 *
 * Cleared by the trigger before the row is stored, so the column is always NULL at rest: it
 * carries a request, and a request is not a fact about the guest worth keeping.
 */
ALTER TABLE public.rsvp_responses
    ADD COLUMN IF NOT EXISTS submission_intent TEXT;

COMMENT ON COLUMN public.rsvp_responses.submission_intent IS
    'Request field read and cleared by resolve_rsvp_identity(): correction or namesake. Always '
    'NULL at rest.';

/*
 * `20260802_secure_rsvp_admin_access.sql` grants `anon` INSERT on named columns, not on the
 * table, so the new request field has to be named or the form's insert is refused outright.
 *
 * `identity_discriminator` is deliberately left out of the grant: the trigger already overwrites
 * whatever arrives, and this makes it unreachable a step earlier, at the privilege level. A guest
 * cannot aim their row next to someone else's even in a build where the trigger is missing.
 */
GRANT INSERT (submission_intent) ON TABLE public.rsvp_responses TO anon;

-- The generated identity gains the mark. DROP and re-add rather than ALTER: the expression of a
-- generated column cannot be changed in place. The unique index goes with the column and is
-- rebuilt below.
ALTER TABLE public.rsvp_responses
    DROP COLUMN IF EXISTS identity_key;

ALTER TABLE public.rsvp_responses
    ADD COLUMN identity_key TEXT
    GENERATED ALWAYS AS (
        lower(btrim(full_name)) || COALESCE('#' || identity_discriminator::TEXT, '')
    ) STORED;

CREATE UNIQUE INDEX IF NOT EXISTS rsvp_responses_identity_unique
    ON public.rsvp_responses (wedding_slug, identity_key)
    WHERE deleted_at IS NULL;


-- ---------------------------------------------------------------------------------------------
-- One decision, taken from what the guest said rather than from what the name suggests.
-- ---------------------------------------------------------------------------------------------

/*
 * Resolves who this submission belongs to, and refuses when it cannot be resolved.
 *
 * Replaces `redirect_duplicate_rsvp()`, whose correction branch is kept intact here: same UPDATE,
 * same transaction-local flag so `record_rsvp_response_audit()` records a guest correction rather
 * than an administrator's edit. What changes is that the branch is only reached when the guest
 * has said they are the same person.
 *
 * SECURITY DEFINER because the anonymous role holds no UPDATE on the table and must not be given
 * one -- unchanged from 20260904. The `20_` prefix keeps it after
 * `rsvp_responses_10_sync_legacy_columns`, which derives `full_name` from `answers`, and after
 * the closure gate at `05_`: a submission for a closed RSVP is refused before any of this.
 */
CREATE OR REPLACE FUNCTION public.resolve_rsvp_identity()
RETURNS TRIGGER AS $$
DECLARE
    intent      TEXT;
    base_key    TEXT;
    existing_id BIGINT;
    holders     INTEGER;
    next_mark   SMALLINT;
BEGIN
    intent := lower(btrim(COALESCE(NEW.submission_intent, '')));
    base_key := lower(btrim(NEW.full_name));

    -- Both are the trigger's to decide, never the caller's.
    NEW.submission_intent := NULL;
    NEW.identity_discriminator := NULL;

    SELECT count(*), min(id)
    INTO holders, existing_id
    FROM public.rsvp_responses
    WHERE wedding_slug = NEW.wedding_slug
      AND lower(btrim(full_name)) = base_key
      AND deleted_at IS NULL;

    IF holders = 0 THEN
        -- Nobody answered under this name. A 'namesake' claim with no original is simply a first
        -- answer, and saying so would only puzzle a guest who mistyped their own name once.
        RETURN NEW;
    END IF;

    IF intent = 'correction' THEN
        IF holders > 1 THEN
            RAISE EXCEPTION 'Several responses share the name % for %', NEW.full_name, NEW.wedding_slug
                USING ERRCODE = 'RSVPM',
                      HINT = 'Ask the couple to correct it: the row cannot be identified by name.';
        END IF;

        PERFORM set_config('app.rsvp_guest_correction', 'on', true);

        UPDATE public.rsvp_responses
        SET answers      = NEW.answers,
            form_id      = NEW.form_id,
            form_version = NEW.form_version,
            locale       = NEW.locale
        WHERE id = existing_id;

        PERFORM set_config('app.rsvp_guest_correction', 'off', true);

        RETURN NULL;
    END IF;

    IF intent = 'namesake' THEN
        SELECT COALESCE(max(identity_discriminator), 1) + 1
        INTO next_mark
        FROM public.rsvp_responses
        WHERE wedding_slug = NEW.wedding_slug
          AND lower(btrim(full_name)) = base_key
          AND deleted_at IS NULL;

        NEW.identity_discriminator := next_mark;
        RETURN NEW;
    END IF;

    RAISE EXCEPTION 'A response already exists under the name % for %', NEW.full_name, NEW.wedding_slug
        USING ERRCODE = 'RSVPD',
              HINT = 'Resubmit with submission_intent set to correction or namesake.';
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public;

-- A trigger function is not meant to be callable on its own, and this one is SECURITY DEFINER.
-- Naming the roles and not only PUBLIC: Supabase grants EXECUTE on every new function in `public`
-- directly to anon and authenticated, and a direct grant survives a revoke of PUBLIC.
REVOKE ALL ON FUNCTION public.resolve_rsvp_identity() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS rsvp_responses_20_redirect_duplicate ON public.rsvp_responses;
DROP TRIGGER IF EXISTS rsvp_responses_20_resolve_identity ON public.rsvp_responses;
CREATE TRIGGER rsvp_responses_20_resolve_identity
    BEFORE INSERT ON public.rsvp_responses
    FOR EACH ROW EXECUTE FUNCTION public.resolve_rsvp_identity();

/*
 * The superseded function goes with its trigger.
 *
 * Keeping it would leave a `SECURITY DEFINER` function that rewrites any row of
 * `rsvp_responses` from a name, reachable by `service_role` (Supabase grants it on creation) and
 * no longer guarded by the closure gate, since that gate is a trigger on INSERT and this updates
 * directly. Nothing calls it: migrations run in order, so no project reaches this line with the
 * old trigger still attached.
 */
DROP FUNCTION IF EXISTS public.redirect_duplicate_rsvp();

-- Review §C1, §C3, §C4 and §C6: the RSVP closure was bypassable, and the trail lied about who
-- wrote a correction.
--
-- `20260904_prevent_duplicate_rsvp.sql` turned a repeat submission into a correction with a
-- BEFORE INSERT trigger that returns NULL. Returning NULL cancels the tuple *before* Postgres
-- evaluates the `WITH CHECK` of `rsvp_responses_insert_anon`, so the `public.is_rsvp_open()`
-- clause that migration 20260902 added to that policy was never reached on the correction path.
-- Measured on a throwaway Postgres with `rsvp_override = 'closed'`: an `anon` INSERT for a guest
-- who already had a row returned `INSERT 0 0` with no error and flipped `attending` from true to
-- false. Two consequences, and the second is the serious one:
--
--   1. closing the RSVP -- the entire purpose of 20260902 -- was avoidable by anyone who already
--      had a row;
--   2. the correction path runs SECURITY DEFINER as the table owner, so any holder of the
--      *public* anon key could overwrite any guest's answers by typing their name. That is the
--      exact attack 20260904's own header claims it avoids ("no new privilege is handed to
--      anonymous callers").
--
-- Enforcing the gate inside the redirect function alone would not be enough: the check has to
-- cover the plain insert and the correction with one rule, and it has to report *why* it refused.
--
-- ERROR CONTRACT -- the client depends on these three codes being distinguishable.
--
--   RSVPC  the invitation exists and its RSVP is closed, by deadline or by manual override.
--   RSVPU  no invitation is registered for that slug: a deployment or sync problem, not a guest
--          problem, and the guest must not be told "the deadline has passed".
--   42501  a genuine privilege failure, i.e. the caller holds no INSERT on the table. Before this
--          migration all three arrived as 42501 and `SupabaseRsvpRepository` mapped every one of
--          them to `RsvpClosedError`, so a project whose `invitations` row was missing showed
--          every guest a closed RSVP with no way to retry.
--
-- The `WITH CHECK` clause on `rsvp_responses_insert_anon` is deliberately left in place. It is
-- now unreachable in practice -- the trigger below raises first -- and that is the point: if the
-- trigger is ever dropped, the policy still fails closed.
--
-- Requires 20260904_prevent_duplicate_rsvp.sql and 20260905_add_admin_audit.sql.


-- ---------------------------------------------------------------------------------------------
-- §C4: deduplicate before the unique index is relied upon.
--
-- 20260904 creates `rsvp_responses_identity_unique` with IF NOT EXISTS, so re-running it is
-- harmless, but on a project that already carried duplicates the original CREATE aborted with
-- `could not create unique index ... Key (w1, ana lopez) is duplicated` -- which is precisely the
-- data condition that migration exists to fix. 20260901 used NOT VALID for the same reason.
-- Soft-deleting the older rows keeps the newest answer, which is the one the guest meant, and
-- leaves the purge to remove them on schedule.
-- ---------------------------------------------------------------------------------------------

WITH ranked AS (
    SELECT id,
           row_number() OVER (
               PARTITION BY wedding_slug, identity_key
               ORDER BY created_at DESC, id DESC
           ) AS recency
    FROM public.rsvp_responses
    WHERE deleted_at IS NULL
)
UPDATE public.rsvp_responses AS target
SET deleted_at = now()
FROM ranked
WHERE target.id = ranked.id
  AND ranked.recency > 1;

CREATE UNIQUE INDEX IF NOT EXISTS rsvp_responses_identity_unique
    ON public.rsvp_responses (wedding_slug, identity_key)
    WHERE deleted_at IS NULL;


-- ---------------------------------------------------------------------------------------------
-- §C1: one gate, both paths, and a reason on the way out.
-- ---------------------------------------------------------------------------------------------

/*
 * Reports whether a slug is registered and whether its RSVP is currently open.
 *
 * SECURITY DEFINER for the same reason as `is_rsvp_open`: `anon` holds no privilege on
 * `invitations` and must not be given one just to be told the RSVP is closed. It exposes two
 * booleans of one row, which is what the gate below needs and nothing more.
 */
CREATE OR REPLACE FUNCTION public.rsvp_invitation_state(p_wedding_slug TEXT)
RETURNS TABLE (registered BOOLEAN, is_open BOOLEAN)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT true, public.is_rsvp_open(inv.wedding_slug)
    FROM public.invitations AS inv
    WHERE inv.wedding_slug = p_wedding_slug;
$$;

REVOKE ALL ON FUNCTION public.rsvp_invitation_state(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rsvp_invitation_state(TEXT) TO anon, authenticated;

/*
 * Refuses a submission the RSVP is not open for, and says which of the two reasons applies.
 *
 * BEFORE INSERT so it covers the plain insert and the correction that `redirect_duplicate_rsvp()`
 * performs; raising here preempts the policy's `WITH CHECK`, which would otherwise report a
 * closed RSVP and a missing invitation with the same 42501.
 *
 * The `05_` prefix puts this ahead of `rsvp_responses_10_sync_legacy_columns` and
 * `rsvp_responses_20_redirect_duplicate`: BEFORE triggers fire in name order and this one reads
 * only `wedding_slug`, which arrives in the payload, so it needs nothing either of them derives.
 *
 * Scoped to the public submission path. `rsvp_responses_insert_anon` only ever bound `anon`, so
 * gating every role would be a new restriction rather than the repair of an existing one: it
 * would stop `service_role` seeding a response and stop the couple's own tooling correcting one
 * after the deadline, neither of which is the hole being closed. SECURITY INVOKER so
 * `current_user` is the role that actually issued the INSERT -- inside a DEFINER function it
 * would read as the owner and the guard would never match.
 */
CREATE OR REPLACE FUNCTION public.require_rsvp_open()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
    open_state BOOLEAN;
    found      BOOLEAN;
BEGIN
    IF current_user NOT IN ('anon', 'authenticated') THEN
        RETURN NEW;
    END IF;

    SELECT state.registered, state.is_open
    INTO found, open_state
    FROM public.rsvp_invitation_state(NEW.wedding_slug) AS state;

    IF NOT COALESCE(found, false) THEN
        RAISE EXCEPTION 'No invitation is registered for wedding_slug %', NEW.wedding_slug
            USING ERRCODE = 'RSVPU',
                  HINT = 'Run scripts/sync-invitation.ts against this project.';
    END IF;

    -- NULL cannot happen once the row is known to exist -- `is_rsvp_open` is total over an
    -- existing row -- but treating it as closed keeps the fail-closed default if that changes.
    IF NOT COALESCE(open_state, false) THEN
        RAISE EXCEPTION 'The RSVP for % is closed', NEW.wedding_slug
            USING ERRCODE = 'RSVPC';
    END IF;

    RETURN NEW;
END;
$$;

-- A trigger function is not meant to be callable on its own. Revoking EXECUTE does not stop the
-- trigger firing -- Postgres checks that privilege when the trigger is created, not when it runs.
-- Naming the roles, not only PUBLIC: Supabase grants EXECUTE on every new function in `public`
-- directly to anon and authenticated, and a direct grant survives a revoke of PUBLIC.
REVOKE ALL ON FUNCTION public.require_rsvp_open() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS rsvp_responses_05_require_open ON public.rsvp_responses;
CREATE TRIGGER rsvp_responses_05_require_open
    BEFORE INSERT ON public.rsvp_responses
    FOR EACH ROW EXECUTE FUNCTION public.require_rsvp_open();


-- ---------------------------------------------------------------------------------------------
-- §C6: a guest correcting their own answer is not an administrative mutation.
--
-- `record_rsvp_response_audit()` fires AFTER UPDATE, and the anonymous correction above *is* an
-- UPDATE, so a guest fixing their own row was written to the trail as `action = 'updated'` with
-- `actor_id = NULL` -- indistinguishable from an admin edit, and contradicting both the
-- function's own docstring ("Anonymous inserts are not audited") and the column comment, which
-- documents a NULL actor as "a purge or a migration".
--
-- Recorded rather than skipped: the couple needs to know an answer changed after they read it.
-- It gets its own action so it can never be read as an administrator's edit.
-- ---------------------------------------------------------------------------------------------

ALTER TABLE public.admin_audit
    DROP CONSTRAINT IF EXISTS admin_audit_action_check;
ALTER TABLE public.admin_audit
    ADD CONSTRAINT admin_audit_action_check
    CHECK (action IN ('updated', 'deleted', 'restored', 'schedule_changed', 'corrected'));

/*
 * Marks the correction it performs, so the audit trigger does not have to guess.
 *
 * Identical to 20260904's version except for the two `set_config` calls. A NULL `actor_id` is not
 * a usable signal on its own: the column comment already documents it as how "a purge or a
 * migration" appears, and `99-verify.sql` asserts that an ownerless edit is still an edit. The
 * flag is transaction-local and cleared immediately after the UPDATE, so it labels exactly the
 * one statement that caused it and nothing else in the same transaction.
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

    PERFORM set_config('app.rsvp_guest_correction', 'on', true);

    UPDATE public.rsvp_responses
    SET answers      = NEW.answers,
        form_id      = NEW.form_id,
        form_version = NEW.form_version,
        locale       = NEW.locale
    WHERE id = existing_id;

    PERFORM set_config('app.rsvp_guest_correction', 'off', true);

    RETURN NULL;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public;

REVOKE ALL ON FUNCTION public.redirect_duplicate_rsvp() FROM PUBLIC, anon, authenticated;

/*
 * Records what happened to a response, and who did it.
 *
 * The action is derived from the transition of `deleted_at` rather than from anything the caller
 * says, so a soft delete cannot be logged as an edit. A guest correcting their own row arrives
 * through `redirect_duplicate_rsvp()`, which flags it: without that flag the same UPDATE was
 * written to the trail as an administrator's edit with a NULL actor, which the column comment
 * reserves for a purge or a migration.
 */
CREATE OR REPLACE FUNCTION public.record_rsvp_response_audit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    actor     UUID := auth.uid();
    performed TEXT;
BEGIN
    performed := CASE
        WHEN OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL THEN 'deleted'
        WHEN OLD.deleted_at IS NOT NULL AND NEW.deleted_at IS NULL THEN 'restored'
        WHEN COALESCE(current_setting('app.rsvp_guest_correction', true), 'off') = 'on'
            THEN 'corrected'
        ELSE 'updated'
    END;

    INSERT INTO public.admin_audit (response_id, entity, wedding_slug, action, actor_id)
    VALUES (NEW.id, 'rsvp_response', NEW.wedding_slug, performed, actor);

    RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.record_rsvp_response_audit() FROM PUBLIC, anon, authenticated;


-- ---------------------------------------------------------------------------------------------
-- §C3: the panel cannot show a switch whose state it is never told.
--
-- `RsvpClosureControl` starts every render at `mode = 'auto'` because `get_rsvp_status` returns
-- only `is_open` and `deadline_utc`; the persisted `rsvp_override` never reaches the client. So
-- the radio misreported a manual closure as "automatic", and saving only the deadline wrote
-- `override: null` and silently reopened the RSVP.
--
-- DROP then CREATE rather than CREATE OR REPLACE: the return type gains a column, and Postgres
-- refuses to replace a function whose OUT parameters changed.
-- ---------------------------------------------------------------------------------------------

DROP FUNCTION IF EXISTS public.get_rsvp_status(TEXT);

CREATE FUNCTION public.get_rsvp_status(p_wedding_slug TEXT)
RETURNS TABLE (is_open BOOLEAN, deadline_utc TIMESTAMPTZ, override TEXT)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT public.is_rsvp_open(inv.wedding_slug), inv.rsvp_deadline_utc, inv.rsvp_override
    FROM public.invitations AS inv
    WHERE inv.wedding_slug = p_wedding_slug;
$$;

REVOKE ALL ON FUNCTION public.get_rsvp_status(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_rsvp_status(TEXT) TO anon, authenticated;

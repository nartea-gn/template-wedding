-- Review §1.2 and §1.3: make the RSVP update rules mean what they say.
--
-- §1.2 — `rsvp_responses_update_admin` and `rsvp_responses_soft_delete_admin` were both
-- PERMISSIVE on the same FOR UPDATE / authenticated pair. Postgres ORs permissive policies
-- together, so the authorship restriction of the second one never restricted anything:
-- any admin already satisfied the first policy and could write `deleted_by` freely.
--
-- Product requirement: any admin of a wedding may delete and restore any response, with no
-- restriction between admins. The only hard requirement is that the record shows who did it,
-- so authorship moves to a trigger, where the client cannot forge it.
--
-- §1.3 — the anonymous INSERT enforces `answers ->> 'fullName' = full_name`, but the admin
-- UPDATE had no equivalent. The legacy per-column mirror is now derived in the database for
-- both INSERT and UPDATE, so it can no longer drift depending on which client wrote the row.

DROP POLICY IF EXISTS rsvp_responses_update_admin ON public.rsvp_responses;
DROP POLICY IF EXISTS rsvp_responses_soft_delete_admin ON public.rsvp_responses;

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

-- Deletion authorship is stamped by the database, not by the client: any admin may delete or
-- restore, but nobody chooses whose name the record carries.
CREATE OR REPLACE FUNCTION public.stamp_rsvp_deletion()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.deleted_at IS NULL THEN
        NEW.deleted_by := NULL;                       -- restore: authorship is cleared
    ELSIF NEW.deleted_at IS DISTINCT FROM OLD.deleted_at THEN
        NEW.deleted_by := auth.uid();                 -- new deletion: author is whoever ran it
    ELSE
        NEW.deleted_by := OLD.deleted_by;             -- editing an already deleted row: author intact
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER SET search_path = public;

REVOKE ALL ON FUNCTION public.stamp_rsvp_deletion() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS rsvp_responses_stamp_deletion ON public.rsvp_responses;
CREATE TRIGGER rsvp_responses_stamp_deletion
    BEFORE UPDATE ON public.rsvp_responses
    FOR EACH ROW EXECUTE FUNCTION public.stamp_rsvp_deletion();

-- §1.3 — single source of truth for the legacy columns. `answers` wins; the flat columns are
-- derived from it on every write, so no authorised client can desynchronise the two.
CREATE OR REPLACE FUNCTION public.sync_rsvp_legacy_columns()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.answers IS NULL THEN
        RETURN NEW;
    END IF;

    IF NEW.answers ? 'fullName' THEN
        NEW.full_name := NEW.answers ->> 'fullName';
    END IF;
    IF NEW.answers ? 'attending' THEN
        NEW.attending := (NEW.answers -> 'attending')::boolean;
    END IF;
    IF NEW.answers ? 'dietaryOptions' THEN
        NEW.dietary_options := COALESCE(
            ARRAY(SELECT jsonb_array_elements_text(NEW.answers -> 'dietaryOptions')),
            ARRAY[]::text[]
        );
    END IF;

    NEW.dietary_other := NULLIF(NEW.answers ->> 'dietaryOther', '');
    NEW.bus_option    := NULLIF(NEW.answers ->> 'busOption', '');
    NEW.song_request  := NULLIF(NEW.answers ->> 'songRequest', '');
    NEW.message       := NULLIF(NEW.answers ->> 'message', '');

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER SET search_path = public;

REVOKE ALL ON FUNCTION public.sync_rsvp_legacy_columns() FROM PUBLIC, anon, authenticated;

-- Postgres fires BEFORE triggers in name order, and later work depends on `full_name` already
-- being derived, so the ordering is encoded in the name rather than left to luck.
DROP TRIGGER IF EXISTS rsvp_responses_sync_legacy_columns ON public.rsvp_responses;
DROP TRIGGER IF EXISTS rsvp_responses_10_sync_legacy_columns ON public.rsvp_responses;
CREATE TRIGGER rsvp_responses_10_sync_legacy_columns
    BEFORE INSERT OR UPDATE ON public.rsvp_responses
    FOR EACH ROW EXECUTE FUNCTION public.sync_rsvp_legacy_columns();

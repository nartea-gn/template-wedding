-- Sprint 7.5A: an audit trail for administrative mutations, and confirmation before deleting.
--
-- Editing, deleting and restoring a response are the three operations an administrator can
-- perform on data a guest handed over. With several administrators per invitation, nothing
-- recorded who did what: a response that changed or vanished left no trace at all.
--
-- The trail is written by a trigger rather than by the browser. A client-side write can be
-- forgotten, reordered or skipped by anyone talking to the API directly, and the author it claims
-- would be self-reported. The trigger reads `auth.uid()` from the request that made the change.
--
-- PRIVACY -- read before extending this table.
--
-- `purge_all_expired_rsvp()` deletes guest answers seven days after the wedding, and that
-- retention is stated to the guest in the article 13 notice of the RSVP form. An audit row that
-- outlived its response would reintroduce, through the back door, exactly what the purge removed:
-- the row id, the wedding and the fact that a named guest's answer existed. The foreign key is
-- therefore `ON DELETE CASCADE` and the trail dies with the data it describes. Do not add guest
-- content -- names, answers, previous values -- to this table: the cascade protects the reference,
-- not a copy.
--
-- Rationale, rejected alternatives and the signals that would reopen this:
-- docs/04-development/adr/ADR-020-admin-audit-trail.md

CREATE TABLE IF NOT EXISTS public.admin_audit (
    id BIGSERIAL PRIMARY KEY,
    -- NULL for entities that are not a guest response; see `entity`.
    response_id BIGINT REFERENCES public.rsvp_responses (id) ON DELETE CASCADE,
    entity TEXT NOT NULL CHECK (entity IN ('rsvp_response', 'invitation')),
    wedding_slug TEXT NOT NULL,
    action TEXT NOT NULL CHECK (action IN ('updated', 'deleted', 'restored', 'schedule_changed')),
    -- The administrator who made the change. NULL when the change did not come from a session,
    -- which is how a purge or a migration would appear.
    actor_id UUID,
    occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT admin_audit_response_required
        CHECK ((entity = 'rsvp_response') = (response_id IS NOT NULL))
);

CREATE INDEX IF NOT EXISTS admin_audit_wedding_occurred_idx
    ON public.admin_audit (wedding_slug, occurred_at DESC);

/*
 * Records what an administrator did to a response.
 *
 * The action is derived from the transition of `deleted_at` rather than from anything the caller
 * says, so a soft delete cannot be logged as an edit. Anonymous inserts are not audited: a guest
 * filling in the form is not an administrative mutation.
 */
CREATE OR REPLACE FUNCTION public.record_rsvp_response_audit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    performed TEXT;
BEGIN
    performed := CASE
        WHEN OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL THEN 'deleted'
        WHEN OLD.deleted_at IS NOT NULL AND NEW.deleted_at IS NULL THEN 'restored'
        ELSE 'updated'
    END;

    INSERT INTO public.admin_audit (response_id, entity, wedding_slug, action, actor_id)
    VALUES (NEW.id, 'rsvp_response', NEW.wedding_slug, performed, auth.uid());

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS record_audit ON public.rsvp_responses;
CREATE TRIGGER record_audit
    AFTER UPDATE ON public.rsvp_responses
    FOR EACH ROW
    EXECUTE FUNCTION public.record_rsvp_response_audit();

/*
 * Records a change to the RSVP deadline or to the manual switch.
 *
 * Carries no `response_id`: it describes the invitation, holds no guest data, and therefore is
 * not swept by the purge.
 */
CREATE OR REPLACE FUNCTION public.record_invitation_schedule_audit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    IF NEW.rsvp_deadline_utc IS DISTINCT FROM OLD.rsvp_deadline_utc
        OR NEW.rsvp_override IS DISTINCT FROM OLD.rsvp_override THEN
        INSERT INTO public.admin_audit (entity, wedding_slug, action, actor_id)
        VALUES ('invitation', NEW.wedding_slug, 'schedule_changed', auth.uid());
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS record_schedule_audit ON public.invitations;
CREATE TRIGGER record_schedule_audit
    AFTER UPDATE ON public.invitations
    FOR EACH ROW
    EXECUTE FUNCTION public.record_invitation_schedule_audit();

-- Readable by the administrators of that invitation and by nobody else. No INSERT, UPDATE or
-- DELETE policy exists on purpose: the trail is written by the triggers above, which run as the
-- table owner, and a trail an administrator can edit is not a trail.
ALTER TABLE public.admin_audit ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS admin_audit_select_admin ON public.admin_audit;
CREATE POLICY admin_audit_select_admin ON public.admin_audit
    FOR SELECT TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.invitation_admins membership
        WHERE membership.invitation_id = admin_audit.wedding_slug
          AND membership.user_id = (SELECT auth.uid())
    ));

REVOKE ALL ON TABLE public.admin_audit FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.admin_audit TO authenticated;

-- Naming the roles, not only PUBLIC: Supabase grants EXECUTE on every new function in `public`
-- directly to `anon` and `authenticated`, and a direct grant survives a revoke of PUBLIC.
REVOKE ALL ON FUNCTION public.record_rsvp_response_audit() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.record_invitation_schedule_audit() FROM PUBLIC, anon, authenticated;

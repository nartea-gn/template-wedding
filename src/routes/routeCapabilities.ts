import type {InvitationCapabilities} from '../core/invitation'

/**
 * Which routes the application registers.
 *
 * The RSVP route is deliberately absent: it is always registered, so a guest who bookmarked
 * `/rsvp` reaches the "the deadline has passed" page instead of "route not found". Admin is
 * gated on the compile-time capability only — never on whether the RSVP is currently open, or
 * the couple would be locked out of the one place where they can reopen it.
 */
export function resolveRouteCapabilities<Message extends string>(
    capabilities: InvitationCapabilities<Message>,
) {
    const hasRsvp = capabilities.rsvp?.enabled === true

    return {
        admin: hasRsvp && capabilities.admin?.enabled === true,
    }
}

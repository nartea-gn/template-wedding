import type {InvitationCapabilities} from '../core/invitation'

/**
 * Which routes the application registers.
 *
 * The RSVP route is gated on the compile-time capability and on nothing else — never on whether
 * the RSVP is currently *open*, so a guest who bookmarked `/rsvp` still reaches the "the deadline
 * has passed" page rather than "route not found". Registering it even when the capability is
 * disabled was worse than either: `Rsvp` returns nothing in that case, so the guest got a blank
 * page. Admin follows the same rule, or the couple would be locked out of the one place where
 * they can reopen the form.
 */
export function resolveRouteCapabilities<Message extends string>(
    capabilities: InvitationCapabilities<Message>,
) {
    const hasRsvp = capabilities.rsvp?.enabled === true

    return {
        rsvp: hasRsvp,
        admin: hasRsvp && capabilities.admin?.enabled === true,
    }
}

import type {InvitationCapabilities} from '../core/invitation'

export function resolveRouteCapabilities<Message extends string>(
    capabilities: InvitationCapabilities<Message>,
    rsvpOpen: boolean,
) {
    const hasRsvp = capabilities.rsvp?.enabled === true

    return {
        rsvp: rsvpOpen,
        admin: hasRsvp && capabilities.admin?.enabled === true,
    }
}

import type {InvitationCapabilities} from '../core/invitation'

export function resolveRouteCapabilities<Message extends string>(capabilities: InvitationCapabilities<Message>) {
    const rsvp = capabilities.rsvp?.enabled === true

    return {
        rsvp,
        admin: rsvp && capabilities.admin?.enabled === true,
    }
}

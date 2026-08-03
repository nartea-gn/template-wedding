import type {InvitationCapabilities} from './types'

const ISO_INSTANT_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:\d{2})$/

export function parseInstant(value: string): number | null {
    if (!ISO_INSTANT_PATTERN.test(value)) return null
    const timestamp = Date.parse(value)
    return Number.isFinite(timestamp) ? timestamp : null
}

export function isValidTimeZone(value: string): boolean {
    try {
        new Intl.DateTimeFormat('en', {timeZone: value})
        return true
    } catch {
        return false
    }
}

export function isRsvpOpen<Message extends string>(
    capability: InvitationCapabilities<Message>['rsvp'],
    now: number = Date.now(),
): boolean {
    if (capability?.enabled !== true) return false
    const deadline = parseInstant(capability.deadline)
    return deadline !== null && now < deadline
}

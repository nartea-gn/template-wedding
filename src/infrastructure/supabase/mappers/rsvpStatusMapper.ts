import type {RsvpStatus} from '../../../features/rsvp/domain/RsvpStatus'

/** One row of `get_rsvp_status`, as PostgREST returns it. */
export type RsvpStatusRow = {
    is_open: boolean | null
    deadline_utc: string | null
    override: string | null
}

/**
 * Narrows a `get_rsvp_status` row to the domain type.
 *
 * Shared by the repository and by the fetch-only reader the landing page uses, so the two cannot
 * disagree about what an unexpected `override` value means.
 */
export function toRsvpStatus(row: RsvpStatusRow): RsvpStatus {
    return {
        isOpen: row.is_open === true,
        deadlineUtc: row.deadline_utc,
        override: row.override === 'open' || row.override === 'closed' ? row.override : null,
    }
}

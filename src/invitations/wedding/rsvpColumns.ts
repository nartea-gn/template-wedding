import type {FormAnswers} from '../../core/forms'

/**
 * Mirror between this wedding's answers and the flat columns of `rsvp_responses`.
 *
 * These field ids belong to `weddingRsvpForm`, not to the storage layer, so they live here
 * rather than inside the generic repository: an invitation whose form calls the guest
 * `guestName` supplies its own mapper instead of breaking the table constraints.
 */
export function toWeddingLegacyColumns(answers: FormAnswers): Record<string, unknown> {
    return {
        full_name: String(answers.fullName ?? ''),
        attending: Boolean(answers.attending),
        dietary_options: Array.isArray(answers.dietaryOptions) ? answers.dietaryOptions : [],
        dietary_other: answers.dietaryOther ? String(answers.dietaryOther) : null,
        bus_option: answers.busOption ? String(answers.busOption) : null,
        song_request: answers.songRequest ? String(answers.songRequest) : null,
        message: answers.message ? String(answers.message) : null,
    }
}

/** Reads rows stored before the `answers` column existed. */
export function readWeddingLegacyAnswers(row: Record<string, unknown>): FormAnswers {
    return {
        fullName: String(row.full_name ?? ''),
        attending: Boolean(row.attending),
        dietaryOptions: Array.isArray(row.dietary_options) ? row.dietary_options.map(String) : [],
        dietaryOther: String(row.dietary_other ?? ''),
        busOption: String(row.bus_option ?? ''),
        songRequest: String(row.song_request ?? ''),
        message: String(row.message ?? ''),
    }
}

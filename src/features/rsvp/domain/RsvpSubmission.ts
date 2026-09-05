import type {FormAnswers} from '../../../core/forms'

export type RsvpSubmission = {
    invitationId: string;
    formId: string;
    formVersion: number;
    locale: string;
    answers: FormAnswers
}
export type RsvpSubmissionRecord = RsvpSubmission & {
    id: number;
    createdAt: string;
    updatedAt?: string;
    deletedAt?: string;
    deletedBy?: string;
}

/**
 * Columns of a stored RSVP record that the admin panel is allowed to change.
 *
 * The snake_case entries are the legacy per-column mirror of {@link RsvpSubmission.answers};
 * the repository keeps both representations in sync on every update.
 */
export type RsvpRecordUpdate = {
    answers: FormAnswers
    locale: string
    full_name: string
    attending: boolean
    dietary_options: string[]
    dietary_other: string | null
    bus_option: string | null
    song_request: string | null
    message: string | null
}

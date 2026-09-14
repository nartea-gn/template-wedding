import type {FormAnswers} from '../../../core/forms'

/**
 * What the guest means when the name they typed already has an answer.
 *
 * Absent on a first attempt: the database refuses the collision with `RSVPD` and the form asks,
 * because a name on its own does not say whether this is the same person coming back or a second
 * guest who shares it. Until 20260911 it guessed the former, and a namesake overwrote a stranger.
 */
export type RsvpSubmissionIntent = 'correction' | 'namesake'

export type RsvpSubmission = {
    invitationId: string;
    formId: string;
    formVersion: number;
    locale: string;
    answers: FormAnswers
    intent?: RsvpSubmissionIntent
}
export type RsvpSubmissionRecord = RsvpSubmission & {
    id: number;
    /**
     * Which holder of a shared name this is, when more than one guest answered under it.
     *
     * `undefined` for the first, `2` for the next, and so on -- the same number the database puts
     * in `identity_key` to keep both rows under one unique index (20260911). The panel shows it
     * because otherwise the couple reads two rows called "Ana López" with nothing to tell them
     * apart, which is the state the migration was written to make possible.
     */
    namesakeMark?: number;
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

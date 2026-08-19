import type {FormAnswers} from '../../../core/forms'
import type {RsvpSubmission, RsvpSubmissionRecord} from '../../../features/rsvp/domain/RsvpSubmission'

type DatabaseRow = Record<string, unknown>

export function toInsertRow(submission: RsvpSubmission) {
    const answers = submission.answers
    return {
        wedding_slug: submission.invitationId,
        form_id: submission.formId,
        form_version: submission.formVersion,
        locale: submission.locale,
        answers,
        full_name: String(answers.fullName ?? ''),
        attending: Boolean(answers.attending),
        dietary_options: Array.isArray(answers.dietaryOptions) ? answers.dietaryOptions : [],
        dietary_other: answers.dietaryOther ? String(answers.dietaryOther) : null,
        bus_option: answers.busOption ? String(answers.busOption) : null,
        song_request: answers.songRequest ? String(answers.songRequest) : null,
        message: answers.message ? String(answers.message) : null,
    }
}

export function fromDatabaseRow(row: DatabaseRow): RsvpSubmissionRecord {
    const legacyAnswers: FormAnswers = {
        fullName: String(row.full_name ?? ''), attending: Boolean(row.attending),
        dietaryOptions: Array.isArray(row.dietary_options) ? row.dietary_options.map(String) : [],
        dietaryOther: String(row.dietary_other ?? ''), busOption: String(row.bus_option ?? ''),
        songRequest: String(row.song_request ?? ''), message: String(row.message ?? ''),
    }
    const answers = row.answers && typeof row.answers === 'object' && !Array.isArray(row.answers) ? row.answers as FormAnswers : legacyAnswers
    return {
        id: Number(row.id),
        createdAt: String(row.created_at),
        updatedAt: row.updated_at ? String(row.updated_at) : undefined,
        deletedAt: row.deleted_at ? String(row.deleted_at) : undefined,
        deletedBy: row.deleted_by ? String(row.deleted_by) : undefined,
        retainedUntil: row.retained_until ? String(row.retained_until) : undefined,
        invitationId: String(row.wedding_slug),
        formId: String(row.form_id ?? 'legacy-wedding-rsvp'),
        formVersion: Number(row.form_version ?? 0),
        locale: String(row.locale ?? 'es'),
        answers
    }
}

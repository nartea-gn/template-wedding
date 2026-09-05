import type {FormAnswers} from '../../../core/forms'
import type {RsvpSubmission, RsvpSubmissionRecord} from '../../../features/rsvp/domain/RsvpSubmission'

type DatabaseRow = Record<string, unknown>

/**
 * Flat columns an invitation mirrors alongside `answers`.
 *
 * The generic repository never names them: each invitation supplies its own mapper, so a form
 * whose fields are called something else does not break the table constraints.
 */
export type LegacyColumnMapper = (answers: FormAnswers) => Record<string, unknown>

/** Reads back the answers of a row written before `answers` existed. */
export type LegacyAnswersReader = (row: DatabaseRow) => FormAnswers

export function toInsertRow(submission: RsvpSubmission) {
    return {
        wedding_slug: submission.invitationId,
        form_id: submission.formId,
        form_version: submission.formVersion,
        locale: submission.locale,
        answers: submission.answers,
    }
}

export function fromDatabaseRow(row: DatabaseRow, readLegacyAnswers?: LegacyAnswersReader): RsvpSubmissionRecord {
    const storedAnswers = row.answers && typeof row.answers === 'object' && !Array.isArray(row.answers)
        ? row.answers as FormAnswers
        : undefined
    return {
        id: Number(row.id),
        createdAt: String(row.created_at),
        updatedAt: row.updated_at ? String(row.updated_at) : undefined,
        deletedAt: row.deleted_at ? String(row.deleted_at) : undefined,
        deletedBy: row.deleted_by ? String(row.deleted_by) : undefined,
        invitationId: String(row.wedding_slug),
        formId: String(row.form_id ?? 'legacy-wedding-rsvp'),
        formVersion: Number(row.form_version ?? 0),
        locale: String(row.locale ?? 'es'),
        answers: storedAnswers ?? readLegacyAnswers?.(row) ?? {},
    }
}

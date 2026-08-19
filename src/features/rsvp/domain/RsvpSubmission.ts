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
    retainedUntil?: string;
}

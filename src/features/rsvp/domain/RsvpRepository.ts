import type {RsvpSubmission, RsvpSubmissionRecord} from './RsvpSubmission'

export type RsvpRepository = {
    submit: (submission: RsvpSubmission) => Promise<void>
    listByInvitation: (invitationId: string) => Promise<RsvpSubmissionRecord[]>
}

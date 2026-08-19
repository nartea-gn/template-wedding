import type {RsvpSubmission, RsvpSubmissionRecord} from './RsvpSubmission'

export type RsvpRepository = {
    submit: (submission: RsvpSubmission) => Promise<void>
    listByInvitation: (invitationId: string) => Promise<RsvpSubmissionRecord[]>
    update: (invitationId: string, id: number, changes: Partial<Pick<RsvpSubmissionRecord, 'answers' | 'full_name' | 'attending' | 'dietary_options' | 'dietary_other' | 'bus_option' | 'song_request' | 'message' | 'locale'>>) => Promise<RsvpSubmissionRecord>
    softDelete: (invitationId: string, id: number) => Promise<void>
    restore: (invitationId: string, id: number) => Promise<void>
    purgeExpired: (invitationId: string) => Promise<void>
}

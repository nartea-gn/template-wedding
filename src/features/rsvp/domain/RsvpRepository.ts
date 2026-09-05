import type {RsvpRecordUpdate, RsvpSubmission, RsvpSubmissionRecord} from './RsvpSubmission'
import type {RsvpScheduleUpdate, RsvpStatus} from './RsvpStatus'

export type RsvpRepository = {
    submit: (submission: RsvpSubmission) => Promise<void>
    getStatus: (invitationId: string) => Promise<RsvpStatus>
    updateSchedule: (invitationId: string, schedule: RsvpScheduleUpdate) => Promise<RsvpStatus>
    listByInvitation: (invitationId: string) => Promise<RsvpSubmissionRecord[]>
    update: (invitationId: string, id: number, changes: Partial<RsvpRecordUpdate>) => Promise<RsvpSubmissionRecord>
    softDelete: (invitationId: string, id: number) => Promise<void>
    restore: (invitationId: string, id: number) => Promise<void>
}

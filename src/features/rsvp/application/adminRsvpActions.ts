import type {RsvpRepository} from '../domain/RsvpRepository'
import type {RsvpRecordUpdate} from '../domain/RsvpSubmission'
import type {RsvpScheduleUpdate} from '../domain/RsvpStatus'

export async function listRsvpResponses(repository: RsvpRepository, invitationId: string) {
    return repository.listByInvitation(invitationId)
}

export async function updateRsvpResponse(repository: RsvpRepository, invitationId: string, id: number, changes: Partial<RsvpRecordUpdate>) {
    return repository.update(invitationId, id, changes)
}

export async function softDeleteRsvpResponse(repository: RsvpRepository, invitationId: string, id: number) {
    return repository.softDelete(invitationId, id)
}

export async function restoreRsvpResponse(repository: RsvpRepository, invitationId: string, id: number) {
    return repository.restore(invitationId, id)
}

export async function updateRsvpSchedule(repository: RsvpRepository, invitationId: string, schedule: RsvpScheduleUpdate) {
    return repository.updateSchedule(invitationId, schedule)
}

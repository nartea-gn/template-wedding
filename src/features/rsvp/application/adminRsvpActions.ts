import type {RsvpRepository} from '../../domain/RsvpRepository'
import type {RsvpSubmissionRecord} from '../../domain/RsvpSubmission'

export async function listRsvpResponses(repository: RsvpRepository, invitationId: string) {
    return repository.listByInvitation(invitationId)
}

export async function updateRsvpResponse(repository: RsvpRepository, invitationId: string, id: number, changes: Partial<Pick<RsvpSubmissionRecord, 'answers' | 'full_name' | 'attending' | 'dietary_options' | 'dietary_other' | 'bus_option' | 'song_request' | 'message' | 'locale'>>) {
    return repository.update(invitationId, id, changes)
}

export async function softDeleteRsvpResponse(repository: RsvpRepository, invitationId: string, id: number) {
    return repository.softDelete(invitationId, id)
}

export async function restoreRsvpResponse(repository: RsvpRepository, invitationId: string, id: number) {
    return repository.restore(invitationId, id)
}

export async function purgeExpiredRsvpResponses(repository: RsvpRepository, invitationId: string) {
    return repository.purgeExpired(invitationId)
}

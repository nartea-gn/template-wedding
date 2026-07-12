import type {RsvpRepository} from '../domain/RsvpRepository'

export async function listRsvpResponses(repository: RsvpRepository, invitationId: string) { return repository.listByInvitation(invitationId) }

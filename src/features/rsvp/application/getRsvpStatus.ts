import type {RsvpRepository} from '../domain/RsvpRepository'
import type {RsvpStatus} from '../domain/RsvpStatus'

/**
 * Reads the live RSVP schedule for an invitation.
 *
 * Callers must treat a rejection as "keep whatever you were showing": the database decides
 * whether a submission is accepted, so a failed read must never close the form by itself.
 */
export async function getRsvpStatus(repository: RsvpRepository, invitationId: string): Promise<RsvpStatus> {
    return repository.getStatus(invitationId)
}

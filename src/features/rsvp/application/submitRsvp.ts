import type {RsvpRepository} from '../domain/RsvpRepository'
import type {RsvpSubmission} from '../domain/RsvpSubmission'

export async function submitRsvp(repository: RsvpRepository, submission: RsvpSubmission): Promise<void> {
    await repository.submit(submission)
}

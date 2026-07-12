import {useState} from 'react'
import type {RsvpRepository} from '../domain/RsvpRepository'
import type {RsvpSubmission} from '../domain/RsvpSubmission'
import {submitRsvp} from '../application/submitRsvp'

export function useRsvpSubmission(repository: RsvpRepository) {
    const [isLoading, setIsLoading] = useState(false), [isSuccess, setIsSuccess] = useState(false), [error, setError] = useState<Error | null>(null)
    const submit = async (submission: RsvpSubmission) => {
        setIsLoading(true);
        setIsSuccess(false);
        setError(null)
        try {
            await submitRsvp(repository, submission);
            setIsSuccess(true)
        } catch (reason) {
            setError(reason instanceof Error ? reason : new Error('Unknown error'))
        } finally {
            setIsLoading(false)
        }
    }
    return {
        submit, isLoading, isSuccess, isError: error !== null, error, reset: () => {
            setIsSuccess(false);
            setError(null)
        }
    }
}

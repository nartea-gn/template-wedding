import {useState} from 'react'
import type {RsvpRepository} from '../domain/RsvpRepository'
import type {RsvpSubmission} from '../domain/RsvpSubmission'
import {submitRsvp} from '../application/submitRsvp'
import {RsvpClosedError} from '../domain/RsvpClosedError'

export function useRsvpSubmission(repository: RsvpRepository) {
    const [isLoading, setIsLoading] = useState(false), [isSuccess, setIsSuccess] = useState(false), [error, setError] = useState<Error | null>(null)
    const [isClosed, setIsClosed] = useState(false)
    const submit = async (submission: RsvpSubmission) => {
        setIsLoading(true);
        setIsSuccess(false);
        setError(null);
        setIsClosed(false)
        try {
            await submitRsvp(repository, submission);
            setIsSuccess(true)
        } catch (reason) {
            if (reason instanceof RsvpClosedError) setIsClosed(true)
            setError(reason instanceof Error ? reason : new Error('Unknown error'))
        } finally {
            setIsLoading(false)
        }
    }
    return {
        submit, isLoading, isSuccess, isError: error !== null, isClosed, error, reset: () => {
            setIsSuccess(false);
            setError(null);
            setIsClosed(false)
        }
    }
}

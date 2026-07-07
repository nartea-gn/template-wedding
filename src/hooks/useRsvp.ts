import {useState} from 'react'
import {supabase} from '../lib/supabaseClient'
import {weddingConfig} from '../config/wedding.config'
import type {RsvpInsert} from '../types/rsvp'

type UseRsvpReturn = {
    submitRsvp: (data: RsvpInsert) => Promise<void>
    isLoading: boolean
    isSuccess: boolean
    isError: boolean
    error: Error | null
    reset: () => void
}

export function useRsvp(): UseRsvpReturn {
    const [isLoading, setIsLoading] = useState(false)
    const [isSuccess, setIsSuccess] = useState(false)
    const [isError, setIsError] = useState(false)
    const [error, setError] = useState<Error | null>(null)

    const submitRsvp = async (data: RsvpInsert) => {
        setIsLoading(true)
        setIsSuccess(false)
        setIsError(false)
        setError(null)
        try {
            const {error: dbError} = await supabase.from('rsvp_responses').insert([{
                wedding_slug: weddingConfig.slug,
                full_name: data.fullName,
                attending: data.attending,
                dietary_options: data.dietaryOptions,
                dietary_other: data.dietaryOther || null,
                bus_option: data.busOption || null,
                song_request: data.songRequest || null,
                message: data.message || null,
            }])
            if (dbError) throw dbError
            setIsSuccess(true)
        } catch (err) {
            setIsError(true)
            setError(err instanceof Error ? err : new Error('Unknown error'))
        } finally {
            setIsLoading(false)
        }
    }

    const reset = () => {
        setIsLoading(false)
        setIsSuccess(false)
        setIsError(false)
        setError(null)
    }

    return {submitRsvp, isLoading, isSuccess, isError, error, reset}
}

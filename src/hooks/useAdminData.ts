import {useCallback, useEffect, useState} from 'react'
import {supabase} from '../lib/supabaseClient'
import {weddingInvitation} from '../invitations/wedding'
import type {RsvpResponse} from '../types/rsvp'

export type Filter = 'all' | 'confirmed' | 'declined' | 'bus'

type UseAdminDataReturn = {
    loading: boolean
    error: string | null
    filter: Filter
    setFilter: (filter: Filter) => void
    totalRespuestas: number
    confirmados: number
    declinados: number
    necesitanBus: number
    filteredResponses: RsvpResponse[]
    refetch: () => void
}

export function useAdminData(isAuthenticated: boolean): UseAdminDataReturn {
    const [responses, setResponses] = useState<RsvpResponse[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [filter, setFilter] = useState<Filter>('all')

    const fetchResponses = useCallback(async () => {
        try {
            setLoading(true)
            setError(null)
            const {data, error: dbError} = await supabase
                .from('rsvp_responses')
                .select('*')
                .eq('wedding_slug', weddingInvitation.id)
                .order('created_at', {ascending: false})

            if (dbError) throw dbError
            setResponses((data || []).map(r => ({
                id: r.id,
                wedding_slug: r.wedding_slug,
                created_at: r.created_at,
                fullName: r.full_name,
                attending: r.attending,
                dietaryOptions: r.dietary_options ?? [],
                dietaryOther: r.dietary_other ?? '',
                busOption: r.bus_option ?? '',
                songRequest: r.song_request ?? '',
                message: r.message ?? '',
            })))
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al cargar las respuestas')
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- data fetching in effect is intentional
        if (isAuthenticated) fetchResponses()
    }, [isAuthenticated, fetchResponses])

    const totalRespuestas = responses.length
    const confirmados = responses.filter(r => r.attending).length
    const declinados = responses.filter(r => !r.attending).length
    const necesitanBus = responses.filter(r => r.attending && r.busOption && r.busOption !== 'no').length

    const filteredResponses = responses.filter(r => {
        if (filter === 'confirmed') return r.attending
        if (filter === 'declined') return !r.attending
        if (filter === 'bus') return r.attending && r.busOption && r.busOption !== 'no'
        return true
    })

    return {
        loading,
        error,
        filter,
        setFilter,
        totalRespuestas,
        confirmados,
        declinados,
        necesitanBus,
        filteredResponses,
        refetch: fetchResponses,
    }
}

import type {SupabaseClient} from '@supabase/supabase-js'
import type {RsvpRepository} from '../../features/rsvp/domain/RsvpRepository'
import type {RsvpSubmission} from '../../features/rsvp/domain/RsvpSubmission'
import {fromDatabaseRow, toInsertRow} from './mappers/rsvpMapper'

export class SupabaseRsvpRepository implements RsvpRepository {
    constructor(private readonly client: SupabaseClient) {
    }

    async submit(submission: RsvpSubmission) {
        const {error} = await this.client.from('rsvp_responses').insert([toInsertRow(submission)])
        if (error) throw error
    }

    async listByInvitation(invitationId: string) {
        const {
            data,
            error
        } = await this.client.from('rsvp_responses').select('*').eq('wedding_slug', invitationId).order('created_at', {ascending: false})
        if (error) throw error
        return (data ?? []).map(row => fromDatabaseRow(row as Record<string, unknown>))
    }

    async update(invitationId: string, id: number, changes: Partial<Pick<RsvpSubmissionRecord, 'answers' | 'full_name' | 'attending' | 'dietary_options' | 'dietary_other' | 'bus_option' | 'song_request' | 'message' | 'locale'>>) {
        const payload: Record<string, unknown> = {...changes}
        if (payload.answers && typeof payload.answers === 'object') {
            const legacy: Record<string, unknown> = {}
            const answers = payload.answers as Record<string, unknown>
            legacy.full_name = String(answers.fullName ?? '')
            legacy.attending = Boolean(answers.attending)
            legacy.dietary_options = Array.isArray(answers.dietaryOptions) ? answers.dietaryOptions : []
            legacy.dietary_other = answers.dietaryOther ? String(answers.dietaryOther) : null
            legacy.bus_option = answers.busOption ? String(answers.busOption) : null
            legacy.song_request = answers.songRequest ? String(answers.songRequest) : null
            legacy.message = answers.message ? String(answers.message) : null
            Object.assign(payload, legacy)
        }
        const {data, error} = await this.client.from('rsvp_responses').update(payload).eq('wedding_slug', invitationId).eq('id', id).select('*').single()
        if (error) throw error
        if (!data) throw new Error('RSVP response not found after update')
        return fromDatabaseRow(data as Record<string, unknown>)
    }

    async softDelete(invitationId: string, id: number) {
        const {error} = await this.client.from('rsvp_responses').update({deleted_at: new Date().toISOString(), deleted_by: (await this.client.auth.getUser()).data.user?.id ?? null}).eq('wedding_slug', invitationId).eq('id', id)
        if (error) throw error
    }

    async restore(invitationId: string, id: number) {
        const {error} = await this.client.from('rsvp_responses').update({deleted_at: null, deleted_by: null}).eq('wedding_slug', invitationId).eq('id', id)
        if (error) throw error
    }

    async purgeExpired(invitationId: string) {
        const {error} = await this.client.rpc('purge_expired_rsvp', {p_wedding_slug: invitationId})
        if (error) throw error
    }
}

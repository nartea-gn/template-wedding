import type {SupabaseClient} from '@supabase/supabase-js'
import type {RsvpRepository} from '../../features/rsvp/domain/RsvpRepository'
import type {RsvpSubmission} from '../../features/rsvp/domain/RsvpSubmission'
import {fromDatabaseRow, toInsertRow} from './mappers/rsvpMapper'

export class SupabaseRsvpRepository implements RsvpRepository {
    constructor(private readonly client: SupabaseClient) {}
    async submit(submission: RsvpSubmission) {
        const {error} = await this.client.from('rsvp_responses').insert([toInsertRow(submission)])
        if (error) throw error
    }
    async listByInvitation(invitationId: string) {
        const {data, error} = await this.client.from('rsvp_responses').select('*').eq('wedding_slug', invitationId).order('created_at', {ascending: false})
        if (error) throw error
        return (data ?? []).map(row => fromDatabaseRow(row as Record<string, unknown>))
    }
}

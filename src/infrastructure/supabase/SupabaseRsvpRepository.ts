import type {SupabaseClient} from '@supabase/supabase-js'
import type {RsvpRepository} from '../../features/rsvp/domain/RsvpRepository'
import type {RsvpRecordUpdate, RsvpSubmission} from '../../features/rsvp/domain/RsvpSubmission'
import type {RsvpScheduleUpdate, RsvpStatus} from '../../features/rsvp/domain/RsvpStatus'
import {RsvpClosedError} from '../../features/rsvp/domain/RsvpClosedError'
import {fromDatabaseRow, toInsertRow, type LegacyAnswersReader, type LegacyColumnMapper} from './mappers/rsvpMapper'

const RLS_VIOLATION = '42501'

export class SupabaseRsvpRepository implements RsvpRepository {
    private readonly client: SupabaseClient
    private readonly toLegacyColumns: LegacyColumnMapper
    private readonly readLegacyAnswers: LegacyAnswersReader | undefined

    /**
     * @param client        Supabase client for the target project.
     * @param legacy        Per-invitation mirror between `answers` and the flat columns. The
     *                      database enforces the same derivation with a trigger; this keeps the
     *                      payload valid for clients that predate it.
     */
    constructor(client: SupabaseClient, legacy: {
        toColumns?: LegacyColumnMapper
        readAnswers?: LegacyAnswersReader
    } = {}) {
        this.client = client
        this.toLegacyColumns = legacy.toColumns ?? (() => ({}))
        this.readLegacyAnswers = legacy.readAnswers
    }

    async submit(submission: RsvpSubmission) {
        const row = {...toInsertRow(submission), ...this.toLegacyColumns(submission.answers)}
        const {error} = await this.client.from('rsvp_responses').insert([row])
        // 42501 is the row level security violation raised by the insert policy once the RSVP
        // deadline has passed or the couple closed it by hand.
        if (error?.code === RLS_VIOLATION) throw new RsvpClosedError()
        if (error) throw error
    }

    /**
     * Reads the live RSVP schedule through a SECURITY DEFINER function.
     *
     * A function rather than a SELECT on `invitations`: it exposes exactly two scalars of one
     * row, today and once that table has ten columns.
     */
    async getStatus(invitationId: string): Promise<RsvpStatus> {
        const {data, error} = await this.client.rpc('get_rsvp_status', {p_wedding_slug: invitationId})
        if (error) throw error
        const row = (data as {is_open: boolean | null; deadline_utc: string | null}[] | null)?.[0]
        if (!row) throw new Error(`No invitation registered for "${invitationId}"`)
        return {isOpen: row.is_open === true, deadlineUtc: row.deadline_utc}
    }

    /**
     * Moves the RSVP deadline or flips the manual switch.
     *
     * Only these two columns are writable by an authenticated admin; the wedding date and the
     * slug are rejected at the privilege level, not just by the policy.
     */
    async updateSchedule(invitationId: string, schedule: RsvpScheduleUpdate): Promise<RsvpStatus> {
        const payload: Record<string, unknown> = {}
        if (schedule.deadlineUtc !== undefined) payload.rsvp_deadline_utc = schedule.deadlineUtc
        if (schedule.override !== undefined) payload.rsvp_override = schedule.override
        const {error} = await this.client.from('invitations').update(payload).eq('wedding_slug', invitationId)
        if (error) throw error
        return this.getStatus(invitationId)
    }

    async listByInvitation(invitationId: string) {
        const {
            data,
            error
        } = await this.client.from('rsvp_responses').select('*').eq('wedding_slug', invitationId).order('created_at', {ascending: false})
        if (error) throw error
        return (data ?? []).map(row => fromDatabaseRow(row as Record<string, unknown>, this.readLegacyAnswers))
    }

    async update(invitationId: string, id: number, changes: Partial<RsvpRecordUpdate>) {
        const payload: Record<string, unknown> = {...changes}
        if (changes.answers) Object.assign(payload, this.toLegacyColumns(changes.answers))
        const {data, error} = await this.client.from('rsvp_responses').update(payload).eq('wedding_slug', invitationId).eq('id', id).select('*').single()
        if (error) throw error
        if (!data) throw new Error('RSVP response not found after update')
        return fromDatabaseRow(data as Record<string, unknown>, this.readLegacyAnswers)
    }

    async softDelete(invitationId: string, id: number) {
        // `deleted_by` is stamped by the rsvp_responses_stamp_deletion trigger; sending it from
        // here would only duplicate a source of truth the client cannot be trusted with.
        const {error} = await this.client.from('rsvp_responses').update({deleted_at: new Date().toISOString()}).eq('wedding_slug', invitationId).eq('id', id)
        if (error) throw error
    }

    async restore(invitationId: string, id: number) {
        const {error} = await this.client.from('rsvp_responses').update({deleted_at: null, deleted_by: null}).eq('wedding_slug', invitationId).eq('id', id)
        if (error) throw error
    }
}

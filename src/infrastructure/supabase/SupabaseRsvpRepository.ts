import type {SupabaseClient} from '@supabase/supabase-js'
import type {RsvpRepository} from '../../features/rsvp/domain/RsvpRepository'
import type {RsvpRecordUpdate, RsvpSubmission} from '../../features/rsvp/domain/RsvpSubmission'
import type {RsvpScheduleUpdate, RsvpStatus} from '../../features/rsvp/domain/RsvpStatus'
import {RsvpClosedError} from '../../features/rsvp/domain/RsvpClosedError'
import {RsvpUnregisteredError} from '../../features/rsvp/domain/RsvpUnregisteredError'
import {RsvpAmbiguousNameError, RsvpNameTakenError} from '../../features/rsvp/domain/RsvpNameTakenError'
import {fromDatabaseRow, toInsertRow, type LegacyAnswersReader, type LegacyColumnMapper} from './mappers/rsvpMapper'
import {toRsvpStatus, type RsvpStatusRow} from './mappers/rsvpStatusMapper'

// Raised by `require_rsvp_open()`, added in 20260907_enforce_rsvp_closure.sql. Before it, a
// closed RSVP, an unregistered slug and a missing privilege all arrived as 42501, and mapping
// that one code to RsvpClosedError told a guest the deadline had passed whenever the project was
// misconfigured. 42501 now means only what it says: the caller holds no INSERT on the table.
const RSVP_CLOSED = 'RSVPC'
const RSVP_UNREGISTERED = 'RSVPU'
// Raised by `resolve_rsvp_identity()`, added in 20260911_distinguish_namesakes.sql. Neither is a
// failure of the form: the first asks the guest which of two people they are, and the second says
// the answer can no longer be attributed from a name alone.
const RSVP_NAME_TAKEN = 'RSVPD'
const RSVP_NAME_AMBIGUOUS = 'RSVPM'

export class SupabaseRsvpRepository implements RsvpRepository {
    private readonly client: SupabaseClient
    private readonly publicClient: SupabaseClient
    private readonly toLegacyColumns: LegacyColumnMapper
    private readonly readLegacyAnswers: LegacyAnswersReader | undefined

    /**
     * @param client        Supabase client for the administrative operations, which need the
     *                      couple's session.
     * @param legacy        Per-invitation mirror between `answers` and the flat columns. The
     *                      database enforces the same derivation with a trigger; this keeps the
     *                      payload valid for clients that predate it.
     * @param legacy.publicClient Session-less client for the guest-facing reads and writes.
     *                      `rsvp_responses_insert_anon` and the sequence grant name `anon` only,
     *                      so a request carrying any session is refused: an admin who opened the
     *                      panel in the same browser could no longer submit the form, and neither
     *                      could a guest who happens to be an administrator. Defaults to `client`
     *                      so a test can supply one double for both roles.
     */
    constructor(client: SupabaseClient, legacy: {
        toColumns?: LegacyColumnMapper
        readAnswers?: LegacyAnswersReader
        publicClient?: SupabaseClient
    } = {}) {
        this.client = client
        this.publicClient = legacy.publicClient ?? client
        this.toLegacyColumns = legacy.toColumns ?? (() => ({}))
        this.readLegacyAnswers = legacy.readAnswers
    }

    async submit(submission: RsvpSubmission) {
        const row = {...toInsertRow(submission), ...this.toLegacyColumns(submission.answers)}
        const {error} = await this.publicClient.from('rsvp_responses').insert([row])
        if (error?.code === RSVP_CLOSED) throw new RsvpClosedError()
        if (error?.code === RSVP_UNREGISTERED) throw new RsvpUnregisteredError()
        if (error?.code === RSVP_NAME_TAKEN) throw new RsvpNameTakenError()
        if (error?.code === RSVP_NAME_AMBIGUOUS) throw new RsvpAmbiguousNameError()
        if (error) throw error
    }

    /**
     * Reads the live RSVP schedule through a SECURITY DEFINER function.
     *
     * A function rather than a SELECT on `invitations`: it exposes exactly three scalars of one
     * row, today and once that table has ten columns.
     */
    async getStatus(invitationId: string): Promise<RsvpStatus> {
        const {data, error} = await this.publicClient.rpc('get_rsvp_status', {p_wedding_slug: invitationId})
        if (error) throw error
        const row = (data as RsvpStatusRow[] | null)?.[0]
        if (!row) throw new RsvpUnregisteredError()
        return toRsvpStatus(row)
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

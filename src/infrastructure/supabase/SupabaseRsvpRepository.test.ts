import type {SupabaseClient} from '@supabase/supabase-js'
import {describe, expect, it, vi} from 'vitest'
import type {RsvpSubmission} from '../../features/rsvp/domain/RsvpSubmission'
import {SupabaseRsvpRepository} from './SupabaseRsvpRepository'
import {RsvpClosedError} from '../../features/rsvp/domain/RsvpClosedError'
import {toWeddingLegacyColumns} from '../../invitations/wedding/rsvpColumns'

const submission: RsvpSubmission = {
    invitationId: 'gala-y-valentin',
    formId: 'wedding-rsvp',
    formVersion: 1,
    locale: 'es',
    answers: {fullName: 'Gala García', attending: true},
}

describe('SupabaseRsvpRepository', () => {
    it('submits only through the RSVP table, with the columns its invitation supplies', async () => {
        const insert = vi.fn().mockResolvedValue({error: null})
        const from = vi.fn().mockReturnValue({insert})
        const repository = new SupabaseRsvpRepository({from} as unknown as SupabaseClient, {toColumns: toWeddingLegacyColumns})

        await repository.submit(submission)

        expect(from).toHaveBeenCalledWith('rsvp_responses')
        expect(insert).toHaveBeenCalledWith([
            expect.objectContaining({wedding_slug: 'gala-y-valentin', full_name: 'Gala García'}),
        ])
    })

    it('scopes and orders administrative reads by invitation', async () => {
        const order = vi.fn().mockResolvedValue({
            data: [{
                id: 7,
                created_at: '2026-08-03T10:00:00Z',
                wedding_slug: 'gala-y-valentin',
                form_id: 'wedding-rsvp',
                form_version: 1,
                locale: 'es',
                answers: submission.answers,
            }],
            error: null,
        })
        const eq = vi.fn().mockReturnValue({order})
        const select = vi.fn().mockReturnValue({eq})
        const from = vi.fn().mockReturnValue({select})
        const repository = new SupabaseRsvpRepository({from} as unknown as SupabaseClient)

        const records = await repository.listByInvitation('gala-y-valentin')

        expect(select).toHaveBeenCalledWith('*')
        expect(eq).toHaveBeenCalledWith('wedding_slug', 'gala-y-valentin')
        expect(order).toHaveBeenCalledWith('created_at', {ascending: false})
        expect(records).toHaveLength(1)
        expect(records[0].answers.fullName).toBe('Gala García')
    })

    it('propagates provider errors without masking them', async () => {
        const providerError = new Error('insert rejected')
        const insert = vi.fn().mockResolvedValue({error: providerError})
        const from = vi.fn().mockReturnValue({insert})
        const repository = new SupabaseRsvpRepository({from} as unknown as SupabaseClient)

        await expect(repository.submit(submission)).rejects.toBe(providerError)
    })

    it('reports a closed RSVP instead of a generic failure when the policy rejects the insert', async () => {
        const insert = vi.fn().mockResolvedValue({error: {code: '42501', message: 'new row violates row-level security policy'}})
        const from = vi.fn().mockReturnValue({insert})
        const repository = new SupabaseRsvpRepository({from} as unknown as SupabaseClient)

        await expect(repository.submit(submission)).rejects.toBeInstanceOf(RsvpClosedError)
    })

    it('updates a single response scoped to its invitation', async () => {
        const single = vi.fn().mockResolvedValue({
            data: {
                id: 7,
                created_at: '2026-08-03T10:00:00Z',
                wedding_slug: 'gala-y-valentin',
                form_id: 'wedding-rsvp',
                form_version: 1,
                locale: 'es',
                answers: {fullName: 'Gala G.', attending: false},
            },
            error: null,
        })
        const select = vi.fn().mockReturnValue({single})
        const eqById = vi.fn().mockReturnValue({select})
        const eqBySlug = vi.fn().mockReturnValue({eq: eqById})
        const update = vi.fn().mockReturnValue({eq: eqBySlug})
        const from = vi.fn().mockReturnValue({update})
        const repository = new SupabaseRsvpRepository({from} as unknown as SupabaseClient, {toColumns: toWeddingLegacyColumns})

        const record = await repository.update('gala-y-valentin', 7, {answers: {fullName: 'Gala G.', attending: false}})

        expect(eqBySlug).toHaveBeenCalledWith('wedding_slug', 'gala-y-valentin')
        expect(eqById).toHaveBeenCalledWith('id', 7)
        expect(update).toHaveBeenCalledWith(expect.objectContaining({full_name: 'Gala G.', attending: false}))
        expect(record.answers.fullName).toBe('Gala G.')
    })

    it('soft deletes without sending an authorship the database stamps itself', async () => {
        const eqById = vi.fn().mockResolvedValue({error: null})
        const eqBySlug = vi.fn().mockReturnValue({eq: eqById})
        const update = vi.fn().mockReturnValue({eq: eqBySlug})
        const from = vi.fn().mockReturnValue({update})
        const repository = new SupabaseRsvpRepository({from} as unknown as SupabaseClient)

        await repository.softDelete('gala-y-valentin', 7)

        const payload = update.mock.calls[0][0]
        expect(payload).toHaveProperty('deleted_at')
        expect(payload).not.toHaveProperty('deleted_by')
        expect(eqById).toHaveBeenCalledWith('id', 7)
    })

    it('restores a response by clearing both deletion columns', async () => {
        const eqById = vi.fn().mockResolvedValue({error: null})
        const eqBySlug = vi.fn().mockReturnValue({eq: eqById})
        const update = vi.fn().mockReturnValue({eq: eqBySlug})
        const from = vi.fn().mockReturnValue({update})
        const repository = new SupabaseRsvpRepository({from} as unknown as SupabaseClient)

        await repository.restore('gala-y-valentin', 7)

        expect(update).toHaveBeenCalledWith({deleted_at: null, deleted_by: null})
    })

    it('reads the live RSVP schedule through the status function', async () => {
        const rpc = vi.fn().mockResolvedValue({data: [{is_open: false, deadline_utc: '2027-05-29T21:59:59Z'}], error: null})
        const repository = new SupabaseRsvpRepository({rpc} as unknown as SupabaseClient)

        const status = await repository.getStatus('gala-y-valentin')

        expect(rpc).toHaveBeenCalledWith('get_rsvp_status', {p_wedding_slug: 'gala-y-valentin'})
        expect(status).toEqual({isOpen: false, deadlineUtc: '2027-05-29T21:59:59Z'})
    })

    it('fails loudly when no invitation row backs the requested slug', async () => {
        const rpc = vi.fn().mockResolvedValue({data: [], error: null})
        const repository = new SupabaseRsvpRepository({rpc} as unknown as SupabaseClient)

        await expect(repository.getStatus('unknown-wedding')).rejects.toThrow('unknown-wedding')
    })

    it('writes only the two scheduling columns and re-reads the resulting state', async () => {
        const rpc = vi.fn().mockResolvedValue({data: [{is_open: false, deadline_utc: null}], error: null})
        const eq = vi.fn().mockResolvedValue({error: null})
        const update = vi.fn().mockReturnValue({eq})
        const from = vi.fn().mockReturnValue({update})
        const repository = new SupabaseRsvpRepository({from, rpc} as unknown as SupabaseClient)

        const status = await repository.updateSchedule('gala-y-valentin', {override: 'closed'})

        expect(from).toHaveBeenCalledWith('invitations')
        expect(update).toHaveBeenCalledWith({rsvp_override: 'closed'})
        expect(status.isOpen).toBe(false)
    })

    it('sends no invitation-specific column when no mapper is configured', async () => {
        const insert = vi.fn().mockResolvedValue({error: null})
        const from = vi.fn().mockReturnValue({insert})
        const repository = new SupabaseRsvpRepository({from} as unknown as SupabaseClient)

        await repository.submit(submission)

        expect(insert).toHaveBeenCalledWith([{
            wedding_slug: 'gala-y-valentin',
            form_id: 'wedding-rsvp',
            form_version: 1,
            locale: 'es',
            answers: submission.answers,
        }])
    })
})

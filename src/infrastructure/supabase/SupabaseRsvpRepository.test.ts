import type {SupabaseClient} from '@supabase/supabase-js'
import {describe, expect, it, vi} from 'vitest'
import type {RsvpSubmission} from '../../features/rsvp/domain/RsvpSubmission'
import {SupabaseRsvpRepository} from './SupabaseRsvpRepository'

const submission: RsvpSubmission = {
    invitationId: 'gala-y-valentin',
    formId: 'wedding-rsvp',
    formVersion: 1,
    locale: 'es',
    answers: {fullName: 'Gala García', attending: true},
}

describe('SupabaseRsvpRepository', () => {
    it('submits only through the RSVP table', async () => {
        const insert = vi.fn().mockResolvedValue({error: null})
        const from = vi.fn().mockReturnValue({insert})
        const repository = new SupabaseRsvpRepository({from} as unknown as SupabaseClient)

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
})

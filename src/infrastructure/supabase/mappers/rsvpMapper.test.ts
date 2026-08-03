import {describe, expect, it} from 'vitest'
import type {RsvpSubmission} from '../../../features/rsvp/domain/RsvpSubmission'
import {fromDatabaseRow, toInsertRow} from './rsvpMapper'

const submission: RsvpSubmission = {
    invitationId: 'gala-y-valentin',
    formId: 'wedding-rsvp',
    formVersion: 1,
    locale: 'es',
    answers: {
        fullName: 'Gala García',
        attending: true,
        dietaryOptions: ['vegetarian'],
        dietaryOther: '',
        busOption: 'ida_vuelta',
        songRequest: 'La vida es bella',
        message: 'Nos vemos pronto',
    },
}

describe('RSVP mapper', () => {
    it('writes the structured payload and compatibility columns', () => {
        expect(toInsertRow(submission)).toMatchObject({
            wedding_slug: 'gala-y-valentin',
            form_id: 'wedding-rsvp',
            full_name: 'Gala García',
            attending: true,
            dietary_options: ['vegetarian'],
            bus_option: 'ida_vuelta',
        })
    })

    it('prefers current structured answers when present', () => {
        const record = fromDatabaseRow({
            id: 4,
            created_at: '2026-08-03T10:00:00Z',
            wedding_slug: 'gala-y-valentin',
            form_id: 'wedding-rsvp',
            form_version: 1,
            locale: 'es',
            answers: submission.answers,
            full_name: 'Legacy name',
            attending: false,
        })

        expect(record.answers).toEqual(submission.answers)
        expect(record.formVersion).toBe(1)
    })

    it('reconstructs legacy answers when JSONB is absent', () => {
        const record = fromDatabaseRow({
            id: 5,
            created_at: '2026-08-03T10:00:00Z',
            wedding_slug: 'legacy-wedding',
            full_name: 'Invitada Legacy',
            attending: true,
            dietary_options: ['gluten'],
            bus_option: 'no',
        })

        expect(record.formId).toBe('legacy-wedding-rsvp')
        expect(record.formVersion).toBe(0)
        expect(record.answers).toMatchObject({
            fullName: 'Invitada Legacy',
            attending: true,
            dietaryOptions: ['gluten'],
            busOption: 'no',
        })
    })
})

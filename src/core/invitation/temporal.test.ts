import {describe, expect, it} from 'vitest'
import {isRsvpOpen, isValidTimeZone, parseInstant} from './temporal'
import {weddingRsvpForm} from '../../invitations/wedding/rsvpForm'

const capability = {
    enabled: true,
    deadline: '2027-05-12T23:59:59+02:00',
    form: weddingRsvpForm,
} as const

describe('invitation temporal contracts', () => {
    it('accepts instants with an explicit offset and rejects ambiguous dates', () => {
        expect(parseInstant('2027-06-12T12:00:00+02:00')).not.toBeNull()
        expect(parseInstant('2027-06-12')).toBeNull()
        expect(parseInstant('2027-06-12T12:00:00')).toBeNull()
    })

    it('validates IANA timezones', () => {
        expect(isValidTimeZone('Europe/Madrid')).toBe(true)
        expect(isValidTimeZone('Madrid')).toBe(false)
    })

    it('treats the RSVP deadline as an exclusive instant', () => {
        const deadline = Date.parse(capability.deadline)
        expect(isRsvpOpen(capability, deadline - 1)).toBe(true)
        expect(isRsvpOpen(capability, deadline)).toBe(false)
    })
})

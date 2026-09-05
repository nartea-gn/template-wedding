import {describe, expect, it} from 'vitest'
import type {InvitationCapabilities} from '../core/invitation'
import {weddingRsvpForm} from '../invitations/wedding/rsvpForm'
import {resolveRouteCapabilities} from './routeCapabilities'

function capabilities(rsvp: boolean, admin: boolean): InvitationCapabilities<string> {
    return {
        rsvp: {enabled: rsvp, deadline: '2027-05-12T23:59:59+02:00', form: weddingRsvpForm},
        admin: {
            enabled: admin,
            auth: {method: 'otp'},
            source: 'rsvp',
            columns: [],
            metrics: {attendanceFieldId: 'attending'},
        },
    }
}

describe('resolveRouteCapabilities', () => {
    it('exposes Admin for the canonical capability pair', () => {
        expect(resolveRouteCapabilities(capabilities(true, true))).toEqual({admin: true})
    })

    it('removes Admin whenever RSVP is disabled', () => {
        expect(resolveRouteCapabilities(capabilities(false, true))).toEqual({admin: false})
    })

    it('keeps Admin hidden when the invitation does not enable it', () => {
        expect(resolveRouteCapabilities(capabilities(true, false))).toEqual({admin: false})
    })

    it('still exposes Admin when the RSVP is closed, so the couple can reopen it', () => {
        const expired: InvitationCapabilities<string> = {
            ...capabilities(true, true),
            rsvp: {enabled: true, deadline: '2020-01-01T00:00:00+01:00', form: weddingRsvpForm},
        }
        expect(resolveRouteCapabilities(expired)).toEqual({admin: true})
    })
})

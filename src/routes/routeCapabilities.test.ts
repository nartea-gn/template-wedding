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
    it('enables both optional routes for the canonical capability pair', () => {
        expect(resolveRouteCapabilities(capabilities(true, true), true)).toEqual({rsvp: true, admin: true})
    })

    it('removes Admin whenever RSVP is disabled', () => {
        expect(resolveRouteCapabilities(capabilities(false, true), false)).toEqual({rsvp: false, admin: false})
    })

    it('allows RSVP without exposing Admin', () => {
        expect(resolveRouteCapabilities(capabilities(true, false), true)).toEqual({rsvp: true, admin: false})
    })

    it('closes RSVP after its deadline without hiding Admin', () => {
        expect(resolveRouteCapabilities(capabilities(true, true), false)).toEqual({rsvp: false, admin: true})
    })
})

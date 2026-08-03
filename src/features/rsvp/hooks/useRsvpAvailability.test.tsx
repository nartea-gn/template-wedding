import {act, render, screen} from '@testing-library/react'
import {afterEach, describe, expect, it, vi} from 'vitest'
import type {InvitationCapabilities} from '../../../core/invitation'
import {weddingRsvpForm} from '../../../invitations/wedding/rsvpForm'
import {useRsvpAvailability} from './useRsvpAvailability'

const deadline = '2027-05-12T23:59:59+02:00'

function AvailabilityProbe({
                               capability,
                           }: Readonly<{
    capability: InvitationCapabilities<string>['rsvp']
}>) {
    return <span>{useRsvpAvailability(capability) ? 'open' : 'closed'}</span>
}

describe('useRsvpAvailability', () => {
    afterEach(() => vi.useRealTimers())

    it('closes the RSVP at the configured instant without requiring a reload', () => {
        vi.useFakeTimers()
        vi.setSystemTime(new Date('2027-05-12T23:59:58+02:00'))

        render(
            <AvailabilityProbe capability={{enabled: true, deadline, form: weddingRsvpForm}}/>,
        )

        expect(screen.getByText('open')).toBeInTheDocument()

        act(() => vi.advanceTimersByTime(1000))

        expect(screen.getByText('closed')).toBeInTheDocument()
    })
})

import {act, render, screen} from '@testing-library/react'
import {afterEach, describe, expect, it, vi} from 'vitest'
import type {InvitationCapabilities} from '../../../core/invitation'
import {weddingRsvpForm} from '../../../invitations/wedding/rsvpForm'
import {useRsvpAvailability} from './useRsvpAvailability'
import {RsvpStatusContext} from './RsvpStatusContext'
import type {RsvpStatus} from '../domain/RsvpStatus'

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

    it('keeps rescheduling for deadlines beyond the maximum timer window', () => {
        vi.useFakeTimers()
        vi.setSystemTime(new Date('2027-01-01T00:00:00+02:00'))
        const farDeadline = '2027-05-12T23:59:59+02:00'

        render(<AvailabilityProbe capability={{enabled: true, deadline: farDeadline, form: weddingRsvpForm}}/>)

        expect(screen.getByText('open')).toBeInTheDocument()

        // More than the ~24.8 day cap of a single setTimeout, so the chain has to reschedule.
        act(() => vi.advanceTimersByTime(40 * 24 * 60 * 60 * 1000))
        expect(screen.getByText('open')).toBeInTheDocument()

        act(() => vi.advanceTimersByTime(200 * 24 * 60 * 60 * 1000))
        expect(screen.getByText('closed')).toBeInTheDocument()
    })

    it.each([
        ['closed', {isOpen: false, deadlineUtc: null, override: 'closed'}, 'closed', 'the couple closed it early'],
        ['open', {isOpen: true, deadlineUtc: null, override: 'open'}, 'open', 'the couple reopened it after the date'],
    ])('lets a live %s status override the compiled deadline, when %s', (_state, status, expected) => {
        vi.useFakeTimers()
        // Compiled deadline already expired, so only the live status can produce "open".
        vi.setSystemTime(new Date('2027-06-01T00:00:00+02:00'))

        render(
            <RsvpStatusContext.Provider value={status as RsvpStatus}>
                <AvailabilityProbe capability={{enabled: true, deadline, form: weddingRsvpForm}}/>
            </RsvpStatusContext.Provider>,
        )

        expect(screen.getByText(expected)).toBeInTheDocument()
    })

    // The timer used to set a `false` the return statement then discarded whenever a live status
    // existed, and RsvpStatusProvider wraps the whole application -- so in production the timer
    // never closed anything. Only the no-provider branch, which these tests took, observed it.
    it('closes the form when the deadline passes even though a live status says it is open', () => {
        vi.useFakeTimers()
        vi.setSystemTime(new Date('2027-05-12T23:59:58+02:00'))

        render(
            <RsvpStatusContext.Provider value={{isOpen: true, deadlineUtc: deadline, override: null}}>
                <AvailabilityProbe capability={{enabled: true, deadline, form: weddingRsvpForm}}/>
            </RsvpStatusContext.Provider>,
        )

        expect(screen.getByText('open')).toBeInTheDocument()

        act(() => vi.advanceTimersByTime(1000))

        expect(screen.getByText('closed')).toBeInTheDocument()
    })

    it('lets a later deadline from the panel reopen a form the timer had closed', () => {
        vi.useFakeTimers()
        vi.setSystemTime(new Date('2027-06-01T00:00:00+02:00'))

        const {rerender} = render(
            <RsvpStatusContext.Provider value={{isOpen: false, deadlineUtc: deadline, override: null}}>
                <AvailabilityProbe capability={{enabled: true, deadline, form: weddingRsvpForm}}/>
            </RsvpStatusContext.Provider>,
        )

        expect(screen.getByText('closed')).toBeInTheDocument()

        rerender(
            <RsvpStatusContext.Provider
                value={{isOpen: true, deadlineUtc: '2027-12-31T23:59:59+02:00', override: null}}>
                <AvailabilityProbe capability={{enabled: true, deadline, form: weddingRsvpForm}}/>
            </RsvpStatusContext.Provider>,
        )

        expect(screen.getByText('open')).toBeInTheDocument()
    })

    it('keeps a manually reopened form open after its deadline', () => {
        vi.useFakeTimers()
        vi.setSystemTime(new Date('2027-06-01T00:00:00+02:00'))

        render(
            <RsvpStatusContext.Provider value={{isOpen: true, deadlineUtc: deadline, override: 'open'}}>
                <AvailabilityProbe capability={{enabled: true, deadline, form: weddingRsvpForm}}/>
            </RsvpStatusContext.Provider>,
        )

        expect(screen.getByText('open')).toBeInTheDocument()
    })

    it('falls back to the compiled deadline while the live status is unknown', () => {
        vi.useFakeTimers()
        vi.setSystemTime(new Date('2027-05-12T23:59:58+02:00'))

        render(
            <RsvpStatusContext.Provider value={null}>
                <AvailabilityProbe capability={{enabled: true, deadline, form: weddingRsvpForm}}/>
            </RsvpStatusContext.Provider>,
        )

        expect(screen.getByText('open')).toBeInTheDocument()
    })
})

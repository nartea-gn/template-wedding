import {render, screen, waitFor} from '@testing-library/react'
import {beforeEach, describe, expect, it, vi} from 'vitest'
import {LocalizationContext, type LocalizationContextValue} from '../app/providers/LocalizationContext'
import AppRouter from './AppRouter'

const repository = vi.hoisted(() => ({
    getStatus: vi.fn(),
    submit: vi.fn(),
    listByInvitation: vi.fn(),
    update: vi.fn(),
    softDelete: vi.fn(),
    restore: vi.fn(),
    updateSchedule: vi.fn(),
}))

vi.mock('../lib/rsvpStatusApi', () => ({fetchRsvpStatus: repository.getStatus}))

const localization: LocalizationContextValue = {
    locale: 'es',
    supportedLocales: ['es'],
    selectorVisible: false,
    isLoading: false,
    error: null,
    t: key => key,
    setLocale: async () => undefined,
    formatDate: value => String(value),
}

describe('AppRouter', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        window.history.pushState({}, '', '/rsvp')
    })

    it('renders the closed page for a bookmarked RSVP link instead of route not found', async () => {
        // The whole point of registering the route unconditionally: a guest who saved the link
        // after the deadline used to fall through to the wildcard and read "route not found".
        repository.getStatus.mockResolvedValue({isOpen: false, deadlineUtc: '2027-05-12T21:59:59Z', override: 'closed'})

        render(
            <LocalizationContext.Provider value={localization}>
                <AppRouter/>
            </LocalizationContext.Provider>,
        )

        // 5s, not the default 1s: this waits on the lazy `/rsvp` chunk being imported, and a
        // dynamic import under machine load is the one thing here that legitimately takes longer
        // than a second. At 1s it was the only load-sensitive test in the suite.
        await waitFor(() => expect(screen.getByText('rsvp.closed.title')).toBeInTheDocument(), {timeout: 5000})
        expect(screen.queryByText('route.notFound')).not.toBeInTheDocument()
    })

    it('renders the form while the RSVP is open', async () => {
        repository.getStatus.mockResolvedValue({isOpen: true, deadlineUtc: '2099-01-01T00:00:00Z', override: null})

        render(
            <LocalizationContext.Provider value={localization}>
                <AppRouter/>
            </LocalizationContext.Provider>,
        )

        await waitFor(
            () => expect(screen.getByRole('textbox', {name: 'rsvp.fullName.label'})).toBeInTheDocument(),
            {timeout: 5000},
        )
    })
})

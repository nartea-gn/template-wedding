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

vi.mock('../invitations/wedding/rsvpRepository', () => ({weddingRsvpRepository: repository}))

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
        repository.getStatus.mockResolvedValue({isOpen: false, deadlineUtc: '2027-05-12T21:59:59Z'})

        render(
            <LocalizationContext.Provider value={localization}>
                <AppRouter/>
            </LocalizationContext.Provider>,
        )

        await waitFor(() => expect(screen.getByText('rsvp.closed.title')).toBeInTheDocument())
        expect(screen.queryByText('route.notFound')).not.toBeInTheDocument()
    })

    it('renders the form while the RSVP is open', async () => {
        repository.getStatus.mockResolvedValue({isOpen: true, deadlineUtc: '2099-01-01T00:00:00Z'})

        render(
            <LocalizationContext.Provider value={localization}>
                <AppRouter/>
            </LocalizationContext.Provider>,
        )

        await waitFor(() => expect(screen.getByLabelText('rsvp.fullName.label')).toBeInTheDocument())
    })
})

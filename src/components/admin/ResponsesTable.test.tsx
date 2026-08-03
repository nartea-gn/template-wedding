import {render, screen} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type {ComponentProps} from 'react'
import {describe, expect, it, vi} from 'vitest'
import {LocalizationContext, type LocalizationContextValue} from '../../app/providers/LocalizationContext'
import type {RsvpSubmissionRecord} from '../../features/rsvp/domain/RsvpSubmission'
import {weddingRsvpForm} from '../../invitations/wedding/rsvpForm'
import {ResponsesTable} from './ResponsesTable'

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

const response: RsvpSubmissionRecord = {
    id: 1,
    createdAt: '2026-08-03T10:00:00Z',
    invitationId: 'gala-y-valentin',
    formId: 'wedding-rsvp',
    formVersion: 1,
    locale: 'es',
    answers: {fullName: 'Invitada de Prueba', attending: true},
}

function renderTable(overrides: Partial<ComponentProps<typeof ResponsesTable>> = {}) {
    const props: ComponentProps<typeof ResponsesTable> = {
        responses: [],
        loading: false,
        hasError: false,
        form: weddingRsvpForm,
        columns: ['fullName', 'attending'],
        onRetry: vi.fn(),
        ...overrides,
    }

    return {
        ...render(
            <LocalizationContext.Provider value={localization}>
                <ResponsesTable {...props}/>
            </LocalizationContext.Provider>,
        ),
        props,
    }
}

describe('ResponsesTable', () => {
    it('announces the loading state', () => {
        renderTable({loading: true})

        expect(screen.getByRole('status')).toHaveTextContent('admin.loading')
    })

    it('shows the empty state after a successful empty response', () => {
        renderTable()

        expect(screen.getByRole('status')).toHaveTextContent('admin.empty')
    })

    it('shows a recoverable error and retries', async () => {
        const user = userEvent.setup()
        const onRetry = vi.fn()
        renderTable({hasError: true, onRetry})

        expect(screen.getByRole('alert')).toHaveTextContent('admin.loadError')
        await user.click(screen.getByRole('button', {name: 'admin.retry'}))
        expect(onRetry).toHaveBeenCalledOnce()
    })

    it('renders configured columns and response data', () => {
        renderTable({responses: [response]})

        const table = screen.getByRole('table', {name: 'admin.table.label'})
        expect(table).toHaveTextContent('rsvp.fullName.label')
        expect(table).toHaveTextContent('rsvp.attending.label')
        expect(table).toHaveTextContent('Invitada de Prueba')
        expect(table).toHaveTextContent('common.yes')
    })
})

import {render, screen, within} from '@testing-library/react'
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
        errorMessage: null,
        rowError: null,
        onRetry: vi.fn(),
        onUpdate: vi.fn(async () => true),
        onDelete: vi.fn(),
        onRestore: vi.fn(),
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

    // Below the table breakpoint each row is stacked, so a bare value loses the column that gave
    // it meaning. The label travels inside the cell, hidden from assistive technology because the
    // header association already conveys it.
    it('repeats its column label inside every data cell', () => {
        renderTable({responses: [response], columns: ['fullName', 'attending']})

        const rows = screen.getAllByRole('row')
        const headers = within(rows[0]).getAllByRole('columnheader').map(header => header.textContent)
        const cells = within(rows[1]).getAllByRole('cell')

        for (const [index, cell] of cells.slice(0, 2).entries()) {
            const label = cell.querySelector('.responses-cell-label')
            expect(label).toHaveTextContent(headers[index] ?? '')
            expect(label).toHaveAttribute('aria-hidden', 'true')
        }
    })

    // The stacked layout sets `display: block` on the table elements, and browsers drop the
    // implicit table semantics when it does. Stating the roles keeps the grid readable to a
    // screen reader at every width instead of only above the breakpoint.
    it('states its table semantics explicitly', () => {
        renderTable({responses: [response], columns: ['fullName', 'attending']})

        expect(screen.getByRole('table')).toHaveAttribute('role', 'table')
        const rows = screen.getAllByRole('row')
        expect(rows[0]).toHaveAttribute('role', 'row')
        expect(within(rows[0]).getAllByRole('columnheader')[0]).toHaveAttribute('role', 'columnheader')
        expect(within(rows[1]).getAllByRole('cell')[0]).toHaveAttribute('role', 'cell')
        expect(screen.getAllByRole('rowgroup')).toHaveLength(2)
    })

    // Deleting is irreversible once the purge runs, and with several administrators per invitation
    // nothing tells the others who removed a row. Asking first, by name, is the cheap half.
    it('asks before deleting and names the guest', async () => {
        const user = userEvent.setup()
        const {props} = renderTable({responses: [response], columns: ['fullName', 'attending']})

        await user.click(screen.getByRole('button', {name: 'admin.actions.delete'}))

        expect(props.onDelete).not.toHaveBeenCalled()
        expect(screen.getByText(/Invitada de Prueba/)).toBeInTheDocument()

        await user.click(screen.getByRole('button', {name: 'admin.actions.confirmDeleteYes'}))

        expect(props.onDelete).toHaveBeenCalledWith(response.id)
    })

    it('keeps the response when the deletion is dismissed', async () => {
        const user = userEvent.setup()
        const {props} = renderTable({responses: [response], columns: ['fullName', 'attending']})

        await user.click(screen.getByRole('button', {name: 'admin.actions.delete'}))
        await user.click(screen.getByRole('button', {name: 'admin.actions.confirmDeleteNo'}))

        expect(props.onDelete).not.toHaveBeenCalled()
        expect(screen.getByRole('button', {name: 'admin.actions.delete'})).toBeInTheDocument()
    })
})

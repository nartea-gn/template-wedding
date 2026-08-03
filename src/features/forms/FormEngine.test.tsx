import {render, screen} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {describe, expect, it, vi} from 'vitest'
import {LocalizationContext, type LocalizationContextValue} from '../../app/providers/LocalizationContext'
import {weddingRsvpForm} from '../../invitations/wedding/rsvpForm'
import {FormEngine} from './FormEngine'

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

function renderForm(onSubmit: ReturnType<typeof vi.fn>) {
    return render(
        <LocalizationContext.Provider value={localization}>
            <FormEngine
                definition={weddingRsvpForm}
                isSubmitting={false}
                hasSubmissionError={false}
                onSubmit={onSubmit}
            />
        </LocalizationContext.Provider>,
    )
}

describe('FormEngine', () => {
    it('shows validation errors before advancing', async () => {
        const user = userEvent.setup()
        renderForm(vi.fn())

        await user.click(screen.getByRole('button', {name: 'rsvp.submit'}))

        expect(screen.getAllByText('form.error.required')).toHaveLength(2)
        expect(screen.getByLabelText('rsvp.fullName.label')).toHaveAttribute('aria-invalid', 'true')
    })

    it('advances through the affirmative flow', async () => {
        const user = userEvent.setup()
        renderForm(vi.fn())

        await user.type(screen.getByLabelText('rsvp.fullName.label'), 'Gala García')
        await user.click(screen.getByLabelText('rsvp.attending.yes'))
        await user.click(screen.getByRole('button', {name: 'rsvp.next'}))

        expect(await screen.findByRole('heading', {name: 'rsvp.step.meal.title'})).toBeInTheDocument()
    })

    it('submits immediately when attendance is declined', async () => {
        const user = userEvent.setup()
        const onSubmit = vi.fn().mockResolvedValue(undefined)
        renderForm(onSubmit)

        await user.type(screen.getByLabelText('rsvp.fullName.label'), 'Valentín García')
        await user.click(screen.getByLabelText('rsvp.attending.no'))
        await user.click(screen.getByRole('button', {name: 'rsvp.submit'}))

        expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({
            fullName: 'Valentín García',
            attending: false,
        }))
    })
})

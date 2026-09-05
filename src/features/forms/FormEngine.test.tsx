import {render, screen} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {describe, expect, it, vi} from 'vitest'
import {LocalizationContext, type LocalizationContextValue} from '../../app/providers/LocalizationContext'
import {weddingRsvpForm} from '../../invitations/wedding/rsvpForm'
import {FormEngine} from './FormEngine'
import type {FormAnswers} from '../../core/forms'

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

function renderForm(onSubmit: (answers: FormAnswers) => Promise<void>, privacyNotice?: string) {
    return render(
        <LocalizationContext.Provider value={localization}>
            <FormEngine
                definition={weddingRsvpForm}
                isSubmitting={false}
                hasSubmissionError={false}
                onSubmit={onSubmit}
                privacyNotice={privacyNotice}
            />
        </LocalizationContext.Provider>,
    )
}

/** Advances past every remaining step and submits. */
async function advanceToSubmit(user: ReturnType<typeof userEvent.setup>) {
    let next = screen.queryByRole('button', {name: 'rsvp.next'})
    while (next) {
        await user.click(next)
        next = screen.queryByRole('button', {name: 'rsvp.next'})
    }
    await user.click(screen.getByRole('button', {name: 'rsvp.submit'}))
}

/** Fills in the first step affirmatively and lands on the meal step. */
async function reachMealStep(user: ReturnType<typeof userEvent.setup>) {
    await user.type(screen.getByLabelText('rsvp.fullName.label'), 'Gala García')
    await user.click(screen.getByLabelText('rsvp.attending.yes'))
    await user.click(screen.getByRole('button', {name: 'rsvp.next'}))
    await screen.findByRole('heading', {name: 'rsvp.step.meal.title'})
}

describe('FormEngine', () => {
    it('shows validation errors before advancing', async () => {
        const user = userEvent.setup()
        renderForm(vi.fn())

        await user.click(screen.getByRole('button', {name: 'rsvp.submit'}))

        expect(screen.getAllByText('form.error.required')).toHaveLength(2)
        expect(screen.getByLabelText('rsvp.fullName.label')).toHaveAttribute('aria-invalid', 'true')
    })

    it('exposes configured text limits to the native control', () => {
        renderForm(vi.fn())

        expect(screen.getByLabelText('rsvp.fullName.label')).toHaveAttribute('maxlength', '120')
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

    it('renders the privacy notice on every step', async () => {
        const user = userEvent.setup()
        renderForm(vi.fn(), 'Aviso del responsable')

        expect(screen.getByText('Aviso del responsable')).toBeInTheDocument()
        await reachMealStep(user)
        expect(screen.getByText('Aviso del responsable')).toBeInTheDocument()
    })

    it('hides the dietary fields until health data consent is given', async () => {
        const user = userEvent.setup()
        renderForm(vi.fn())

        await reachMealStep(user)

        expect(screen.queryByText('rsvp.dietary.label')).not.toBeInTheDocument()
        await user.click(screen.getByLabelText('rsvp.dietary.consent.yes'))
        expect(screen.getByText('rsvp.dietary.label')).toBeInTheDocument()
    })

    it('lets a guest decline the health data consent and still submit', async () => {
        const user = userEvent.setup()
        const onSubmit = vi.fn().mockResolvedValue(undefined)
        renderForm(onSubmit)

        await reachMealStep(user)
        await user.click(screen.getByLabelText('rsvp.dietary.consent.no'))
        await advanceToSubmit(user)

        expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({dietaryConsent: false}))
    })

    it('drops the dietary answers when the consent is revoked', async () => {
        const user = userEvent.setup()
        const onSubmit = vi.fn().mockResolvedValue(undefined)
        renderForm(onSubmit)

        await reachMealStep(user)
        await user.click(screen.getByLabelText('rsvp.dietary.consent.yes'))
        await user.click(screen.getByLabelText('rsvp.dietary.gluten'))
        await user.click(screen.getByLabelText('rsvp.dietary.consent.no'))
        await advanceToSubmit(user)

        const answers = onSubmit.mock.calls[0][0]
        expect(answers).not.toHaveProperty('dietaryOptions')
        expect(answers).not.toHaveProperty('dietaryOther')
    })
})

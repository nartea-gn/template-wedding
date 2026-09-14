import {describe, expect, it} from 'vitest'
import {render, screen} from '@testing-library/react'
import {StatsBreakdown} from './StatsBreakdown'
import {LocalizationContext, type LocalizationContextValue} from '../../app/providers/LocalizationContext'
import type {FormDefinition} from '../../core/forms'

const localization: LocalizationContextValue = {
    locale: 'es',
    supportedLocales: ['es'],
    selectorVisible: false,
    isLoading: false,
    error: null,
    t: (key: string) => key,
    setLocale: async () => {},
    formatDate: () => '',
}

const form = {
    steps: [{
        id: 'menu',
        title: 'rsvp.menu.title',
        elements: [{
            type: 'radio',
            id: 'menuChoice',
            label: 'rsvp.menu.question',
            options: [
                {value: 'meat', label: 'rsvp.menu.meat'},
                {value: 'fish', label: 'rsvp.menu.fish'},
                {value: 'vegan', label: 'rsvp.menu.vegan'},
            ],
        }],
    }],
} as unknown as FormDefinition<string>

function renderBreakdown(labels?: Record<string, string>) {
    return render(
        <LocalizationContext.Provider value={localization}>
            <StatsBreakdown
                breakdowns={[{fieldId: 'menuChoice', tally: {meat: 3, fish: 1}}]}
                form={form}
                labels={labels}/>
        </LocalizationContext.Provider>,
    )
}

describe('StatsBreakdown', () => {
    it('titles the block with its own label instead of the question the guest answered', () => {
        // Given a panel that names the block for the couple rather than for the guest
        // When the breakdown renders
        renderBreakdown({menuChoice: 'admin.menus'})

        // Then the heading is that name, not the form question
        expect(screen.getByRole('heading', {name: 'admin.menus'})).toBeInTheDocument()
        expect(screen.queryByRole('heading', {name: 'rsvp.menu.question'})).not.toBeInTheDocument()
    })

    it('falls back to the form label when the block has no name of its own', () => {
        // Given a panel that declares no breakdown label
        // When the breakdown renders
        renderBreakdown()

        // Then the form label still titles the block
        expect(screen.getByRole('heading', {name: 'rsvp.menu.question'})).toBeInTheDocument()
    })

    it('states the zero of an option nobody picked', () => {
        // Given a tally where one option was never chosen
        // When the breakdown renders
        const {container} = renderBreakdown({menuChoice: 'admin.menus'})

        // Then that option keeps its card and its zero, instead of disappearing
        const items = container.querySelectorAll('.breakdown-item')
        expect(items[2].textContent).toContain('rsvp.menu.vegan')
        expect(items[2].textContent).toContain('0')
    })

    it('closes the arithmetic with the plates the counts add up to', () => {
        // Given three guests on meat and one on fish
        // When the breakdown renders
        const {container} = renderBreakdown({menuChoice: 'admin.menus'})

        // Then a last card totals the options counted, not the responses stored
        const total = container.querySelector('.breakdown-item--total')
        expect(total?.textContent).toContain('4')
        expect(total?.textContent).toContain('admin.breakdown.totalNote')
    })
})

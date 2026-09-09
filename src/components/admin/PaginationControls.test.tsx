import {render, screen} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {beforeEach, describe, expect, it, vi} from 'vitest'
import {LocalizationContext, type LocalizationContextValue} from '../../app/providers/LocalizationContext'
import {PaginationControls} from './PaginationControls'

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

function renderControls(currentPage: number, onPageChange = vi.fn()) {
    const view = render(
        <LocalizationContext.Provider value={localization}>
            <div id="target"/>
            <PaginationControls currentPage={currentPage} totalPages={6} onPageChange={onPageChange}
                                scrollTargetId="target"/>
        </LocalizationContext.Provider>,
    )
    return {...view, onPageChange}
}

describe('PaginationControls', () => {
    let scrollIntoView: ReturnType<typeof vi.fn>

    beforeEach(() => {
        // jsdom no implementa scrollIntoView; el cast es por la firma sobrecargada del DOM.
        scrollIntoView = vi.fn()
        Element.prototype.scrollIntoView = scrollIntoView as unknown as Element['scrollIntoView']
    })

    // La regresion: cambiar de pagina solo movia el estado, asi que a 390 px la pareja aterrizaba
    // 3.143 px por debajo del inicio de la pagina que acababa de pedir.
    it('brings the list back into view once the page has actually changed', async () => {
        const user = userEvent.setup()
        const {rerender, onPageChange} = renderControls(1)

        await user.click(screen.getByRole('button', {name: 'admin.pagination.next'}))
        expect(onPageChange).toHaveBeenCalledWith(2)

        rerender(
            <LocalizationContext.Provider value={localization}>
                <div id="target"/>
                <PaginationControls currentPage={2} totalPages={6} onPageChange={onPageChange}
                                    scrollTargetId="target"/>
            </LocalizationContext.Provider>,
        )

        expect(scrollIntoView).toHaveBeenCalledWith({block: 'start'})
    })

    it('leaves the scroll alone on mount, so filtering does not yank the page', () => {
        renderControls(3)

        expect(scrollIntoView).not.toHaveBeenCalled()
    })
})

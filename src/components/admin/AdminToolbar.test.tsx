import {describe, expect, it, vi} from 'vitest'
import {render, screen} from '@testing-library/react'
import {AdminToolbar} from './AdminToolbar'
import {LocalizationContext, type LocalizationContextValue} from '../../app/providers/LocalizationContext'
import type {AdminFilter} from '../../hooks/useAdminData'

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

function renderToolbar(extra: Partial<Parameters<typeof AdminToolbar>[0]> = {}) {
    return render(
        <LocalizationContext.Provider value={localization}>
            <AdminToolbar
                controls={undefined}
                filter="all"
                setFilter={vi.fn()}
                query=""
                setQuery={vi.fn()}
                sortOrder="newest"
                setSortOrder={vi.fn()}
                resultCount={0}
                totalResponses={0}
                pageSize={10}
                setPageSize={vi.fn()}
                exportDisabled={false}
                onExport={vi.fn()}
                {...extra}
            />
        </LocalizationContext.Provider>,
    )
}

const vistas = () => [...screen.getByRole('combobox', {name: 'admin.filter.label'}).querySelectorAll('option')]
    .map(option => option.value)

describe('AdminToolbar', () => {
    it('offers a view for every section this wedding actually asks about', () => {
        // Given a wedding that asks for the coach and for dietary needs
        const todas = ['all', 'confirmed', 'declined', 'bus', 'dietary'] as AdminFilter[]

        // When the toolbar renders
        renderToolbar({sectionFilters: todas})

        // Then all of them are offered, with the deleted view last
        expect(vistas()).toEqual(['all', 'confirmed', 'declined', 'bus', 'dietary', 'deleted'])
    })

    // Un filtro que no puede llenarse nunca es peor que no tenerlo: `needsTransport` devuelve
    // `false` cuando no hay `transportFieldId`, asi que la vista "Necesitan bus" de una boda sin
    // autobus era una lista vacia sin explicacion.
    it('drops the view of a section the wedding switched off', () => {
        // Given a wedding with no coach and no dietary question
        renderToolbar({sectionFilters: ['all', 'confirmed', 'declined'] as AdminFilter[]})

        // When the filter is read
        // Then neither view is offered at all
        expect(vistas()).toEqual(['all', 'confirmed', 'declined', 'deleted'])
    })

    it('groups the views by what the guest chose, under the question they answered', () => {
        // Given a wedding that declares a menu breakdown
        renderToolbar({
            sectionFilters: ['all', 'confirmed', 'declined'] as AdminFilter[],
            choiceFilters: [{
                groupLabel: '¿Qué menú prefieres?',
                options: [
                    {value: 'choice:menuChoice:meat' as AdminFilter, label: 'Carne'},
                    {value: 'choice:menuChoice:fish' as AdminFilter, label: 'Pescado'},
                ],
            }],
        })

        // When the filter is read
        // Then the per-value views hang from the question, not loose among the fixed ones
        const grupo = screen.getByRole('group', {name: '¿Qué menú prefieres?'})
        expect([...grupo.querySelectorAll('option')].map(option => option.value))
            .toEqual(['choice:menuChoice:meat', 'choice:menuChoice:fish'])
    })

    it('falls back to the three views no section governs', () => {
        // Given a caller that passes no list at all
        renderToolbar()

        // When the filter renders
        // Then it is still usable instead of offering only the deleted rows
        expect(vistas()).toEqual(['all', 'confirmed', 'declined', 'deleted'])
    })
})

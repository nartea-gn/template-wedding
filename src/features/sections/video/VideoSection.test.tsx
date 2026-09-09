import {render, screen} from '@testing-library/react'
import {describe, expect, it} from 'vitest'
import {LocalizationContext, type LocalizationContextValue} from '../../../app/providers/LocalizationContext'
import {weddingInvitation} from '../../../invitations/wedding'
import {VideoSection} from './VideoSection'

const localization: LocalizationContextValue = {
    locale: 'es',
    supportedLocales: ['es'],
    selectorVisible: false,
    isLoading: false,
    error: null,
    t: key => key,
    setLocale: async () => undefined,
    formatDate: value => `FECHA(${String(value)})`,
}

const found = weddingInvitation.sections.find(section => section.type === 'video')
if (!found || found.type !== 'video') throw new Error('Canonical video section not found')
// Alias tras la guarda: el estrechamiento del `find` no sobrevive dentro de la función de abajo.
const videoSection = found

function renderSection(dateOverlay: boolean) {
    return render(
        <LocalizationContext.Provider value={localization}>
            <VideoSection
                section={{...videoSection, content: {...videoSection.content, dateOverlay}}}
                event={weddingInvitation.event}
                capabilities={weddingInvitation.capabilities}
                src="/video.mp4"
                poster="/poster.webp"
            />
        </LocalizationContext.Provider>,
    )
}

describe('VideoSection', () => {
    // La fecha vivia quemada en el poster -- "Wedding Day 26.06.2027" contra el 2027-06-12 del
    // contrato -- donde no se puede traducir, ni corregir sin un editor grafico, ni comprobar.
    it('renders the event date as text when the overlay is enabled', () => {
        renderSection(true)

        expect(screen.getByText(`FECHA(${weddingInvitation.event.date})`)).toBeInTheDocument()
    })

    // Apagado por defecto mientras el poster siga llevando la suya: dos fechas distintas a la vez
    // serian peor que una sola equivocada.
    it('renders no date when the overlay is disabled', () => {
        renderSection(false)

        expect(screen.queryByText(`FECHA(${weddingInvitation.event.date})`)).not.toBeInTheDocument()
    })

    it('ships with the overlay disabled while the poster carries a burnt-in date', () => {
        expect(videoSection.content.dateOverlay).toBe(false)
    })
})

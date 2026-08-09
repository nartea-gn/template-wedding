import {render, screen} from '@testing-library/react'
import {describe, expect, it} from 'vitest'
import {LocalizationProvider} from '../../app/providers/LocalizationProvider'
import {esMessages, type WeddingLocale} from '../../invitations/wedding'
import {LanguageSelector} from './LanguageSelector'

describe('LanguageSelector', () => {
    it('stays hidden when the invitation is monolingual', () => {
        render(
            <LocalizationProvider<WeddingLocale>
                invitationId="monolingual-test"
                definition={{defaultLocale: 'es', supportedLocales: ['es'], selector: {visible: true}}}
                defaultCatalog={esMessages}
                loaders={{}}
                timeZone="Europe/Madrid"
            >
                <LanguageSelector/>
            </LocalizationProvider>,
        )

        expect(screen.queryByRole('button', {name: 'Idioma: Español'})).not.toBeInTheDocument()
        expect(document.documentElement.lang).toBe('es')
    })
})

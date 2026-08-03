import {render, waitFor} from '@testing-library/react'
import {describe, expect, it} from 'vitest'
import {LocalizationProvider} from '../app/providers/LocalizationProvider'
import {SeoMetadata} from './SeoMetadata'

describe('SeoMetadata', () => {
    it('applies the localized title and description to the document', async () => {
        render(
            <LocalizationProvider
                invitationId="seo-test"
                definition={{defaultLocale: 'es', supportedLocales: ['es'], selector: {visible: false}}}
                defaultCatalog={{seoTitle: 'Invitación de prueba', seoDescription: 'Descripción localizada'}}
                loaders={{}}
                timeZone="Europe/Madrid"
            >
                <SeoMetadata definition={{title: 'seoTitle', description: 'seoDescription'}}/>
            </LocalizationProvider>,
        )

        await waitFor(() => expect(document.title).toBe('Invitación de prueba'))
        expect(document.querySelector('meta[name="description"]')).toHaveAttribute(
            'content',
            'Descripción localizada',
        )
    })
})

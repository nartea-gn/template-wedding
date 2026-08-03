import {render, screen} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {describe, expect, it} from 'vitest'
import {useLocalization} from './useLocalization'
import {LocalizationProvider} from './LocalizationProvider'

function CatalogProbe() {
    const {locale, t, setLocale} = useLocalization()

    return <>
        <p>{locale}</p>
        <p>{t('greeting')}</p>
        <p>{t('defaultOnly')}</p>
        <button type="button" onClick={() => void setLocale('en')}>English</button>
    </>
}

describe('LocalizationProvider', () => {
    it('loads another catalog and falls back to the default catalog per key', async () => {
        const user = userEvent.setup()

        render(
            <LocalizationProvider
                invitationId="gala-y-valentin"
                definition={{defaultLocale: 'es', supportedLocales: ['es', 'en'], selector: {visible: true}}}
                defaultCatalog={{greeting: 'Hola', defaultOnly: 'Texto base'}}
                loaders={{en: async () => ({greeting: 'Hello'})}}
                timeZone="Europe/Madrid"
            >
                <CatalogProbe/>
            </LocalizationProvider>,
        )

        await user.click(screen.getByRole('button', {name: 'English'}))

        expect(await screen.findByText('Hello')).toBeInTheDocument()
        expect(screen.getByText('Texto base')).toBeInTheDocument()
        expect(screen.getByText('en')).toBeInTheDocument()
        expect(localStorage.getItem('invitation:gala-y-valentin:locale')).toBe('en')
    })
})

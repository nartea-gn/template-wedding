import {render, screen} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {describe, expect, it} from 'vitest'
import {LocalizationContext, type LocalizationContextValue} from '../../../app/providers/LocalizationContext'
import type {GiftsSection as GiftsSectionDefinition} from '../../../core/invitation'
import {weddingInvitation} from '../../../invitations/wedding'
import {GiftsSection} from './GiftsSection'

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

const account = {
    iban: 'ES00 0000 0000 0000 0000 0000',
    holderKey: 'gifts.account.holder',
    bizum: '+34 600 000 000',
    revealOnRequest: true,
    revealLabel: 'gifts.account.reveal',
    ibanLabel: 'gifts.account.iban',
    bizumLabel: 'gifts.account.bizum',
    copyLabel: 'gifts.account.copy',
    copiedLabel: 'gifts.account.copied',
} as const

function renderGifts(content: Partial<GiftsSectionDefinition<string>['content']>) {
    const section: GiftsSectionDefinition<string> = {
        id: 'gifts',
        type: 'gifts',
        enabled: true,
        content: {
            label: 'gifts.label',
            fraudWarningKey: 'gifts.warning',
            newTabLabel: 'gifts.newTab',
            ...content,
        },
    }
    return render(
        <LocalizationContext.Provider value={localization}>
            <GiftsSection section={section} event={weddingInvitation.event}
                          capabilities={weddingInvitation.capabilities}/>
        </LocalizationContext.Provider>,
    )
}

describe('GiftsSection', () => {
    it('renders only the registry link when there is no account', () => {
        renderGifts({registry: {url: 'https://example.com/list', labelKey: 'gifts.registry.label'}})

        expect(screen.getByRole('link', {name: /gifts.registry.label/})).toHaveAttribute('href', 'https://example.com/list')
        expect(screen.queryByText('gifts.account.reveal')).not.toBeInTheDocument()
    })

    it('keeps the account details out of the document until a guest asks', async () => {
        const user = userEvent.setup()
        renderGifts({account})

        expect(screen.queryByText(account.iban)).not.toBeInTheDocument()

        await user.click(screen.getByRole('button', {name: 'gifts.account.reveal'}))

        expect(screen.getByText(account.iban)).toBeInTheDocument()
        expect(screen.getByText(account.bizum)).toBeInTheDocument()
    })

    it('shows the account immediately when the couple opted out of the reveal', () => {
        renderGifts({account: {...account, revealOnRequest: false}})

        expect(screen.getByText(account.iban)).toBeInTheDocument()
    })

    it('always warns about the number-change fraud alongside the account', () => {
        renderGifts({account})

        expect(screen.getByText('gifts.warning')).toBeInTheDocument()
    })

    it('renders both modes together', () => {
        renderGifts({registry: {url: 'https://example.com/list', labelKey: 'gifts.registry.label'}, account})

        expect(screen.getByRole('link', {name: /gifts.registry.label/})).toBeInTheDocument()
        expect(screen.getByRole('button', {name: 'gifts.account.reveal'})).toBeInTheDocument()
    })
})

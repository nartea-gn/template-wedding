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

const bizumNumbers = [
    {labelKey: 'hero.partnerOne', value: '+34 600 000 000'},
    {labelKey: 'hero.partnerTwo', value: '+34 611 000 000'},
] as const

const bizum = {enabled: true, labelKey: 'gifts.account.bizum', numbers: bizumNumbers} as const

const account = {
    iban: 'ES00 0000 0000 0000 0000 0000',
    holderKey: 'gifts.account.holder',
    bizum,
    revealOnRequest: true,
    revealLabel: 'gifts.account.reveal',
    ibanLabel: 'gifts.account.iban',
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
        expect(screen.getByText(bizumNumbers[0].value)).toBeInTheDocument()
    })

    it('shows the account immediately when the couple opted out of the reveal', () => {
        renderGifts({account: {...account, revealOnRequest: false}})

        expect(screen.getByText(account.iban)).toBeInTheDocument()
    })

    it('renders every Bizum number the couple declared', () => {
        renderGifts({account: {...account, revealOnRequest: false}})

        for (const number of bizumNumbers) {
            expect(screen.getByText(number.labelKey)).toBeInTheDocument()
            expect(screen.getByText(number.value)).toBeInTheDocument()
        }
    })

    it('names the group so the numbers read as Bizum and not as loose phones', () => {
        renderGifts({account: {...account, revealOnRequest: false}})

        expect(screen.getByRole('group', {name: 'gifts.account.bizum'})).toBeInTheDocument()
    })

    it('names the copy buttons with the group and the person', () => {
        renderGifts({account: {...account, revealOnRequest: false}})

        expect(screen.getByRole('button', {name: 'gifts.account.copy gifts.account.bizum hero.partnerOne'}))
            .toBeInTheDocument()
        expect(screen.getByRole('button', {name: 'gifts.account.copy gifts.account.iban'})).toBeInTheDocument()
    })

    it('warns about the number-change fraud alongside the Bizum numbers', () => {
        renderGifts({account: {...account, revealOnRequest: false}})

        expect(screen.getByText('gifts.warning')).toBeInTheDocument()
    })

    it('holds the warning back until the numbers are on screen', () => {
        renderGifts({account})

        expect(screen.queryByText('gifts.warning')).not.toBeInTheDocument()
    })

    it.each([
        ['the couple disabled it', {...bizum, enabled: false}],
        ['it is enabled without a number', {...bizum, numbers: []}],
        ['it is not declared at all', undefined],
    ])('drops the Bizum block and its warning when %s', (_case, declaration) => {
        renderGifts({account: {...account, revealOnRequest: false, bizum: declaration}})

        expect(screen.getByText(account.iban)).toBeInTheDocument()
        expect(screen.queryByText(bizumNumbers[0].value)).not.toBeInTheDocument()
        expect(screen.queryByText('gifts.account.bizum')).not.toBeInTheDocument()
        expect(screen.queryByText('gifts.warning')).not.toBeInTheDocument()
    })

    it('renders both modes together', () => {
        renderGifts({registry: {url: 'https://example.com/list', labelKey: 'gifts.registry.label'}, account})

        expect(screen.getByRole('link', {name: /gifts.registry.label/})).toBeInTheDocument()
        expect(screen.getByRole('button', {name: 'gifts.account.reveal'})).toBeInTheDocument()
    })
})

import {render, screen} from '@testing-library/react'
import {describe, expect, it} from 'vitest'
import {LocalizationContext, type LocalizationContextValue} from '../../../app/providers/LocalizationContext'
import type {RsvpCtaSection as RsvpCtaSectionDefinition} from '../../../core/invitation'
import {weddingInvitation} from '../../../invitations/wedding'
import {RsvpStatusContext} from '../../rsvp/hooks/RsvpStatusContext'
import type {RsvpStatus} from '../../rsvp/domain/RsvpStatus'
import {RsvpCtaSection} from './RsvpCtaSection'
import {MemoryRouter} from 'react-router-dom'

const DEADLINE = '2027-05-12T23:59:59+02:00'
const NOTICE_KEY = 'rsvp.deadline.notice'

const localization: LocalizationContextValue = {
    locale: 'es',
    supportedLocales: ['es'],
    selectorVisible: false,
    isLoading: false,
    error: null,
    // The notice answers with its real template so the substitution is actually exercised; every
    // other key answers with itself, which is what the rest of the assertions read.
    t: key => (key === NOTICE_KEY ? 'Confírmanos antes del {date}.' : key),
    setLocale: async () => undefined,
    // Stands in for `Intl`: the test asserts that the hole is filled with the deadline the RSVP is
    // governed by, not how Spanish spells a month.
    formatDate: value => `fecha(${String(value)})`,
}

const COMPILED_NOTICE = `Confírmanos antes del fecha(${weddingInvitation.capabilities.rsvp.deadline}).`

function renderCta(
    content: Partial<RsvpCtaSectionDefinition<string>['content']>,
    status: RsvpStatus | null = null,
) {
    const section: RsvpCtaSectionDefinition<string> = {
        id: 'rsvp-cta',
        type: 'rsvp-cta',
        enabled: true,
        content: {label: 'rsvp.cta', closedLabel: 'rsvp.closed.cta', ...content},
    }
    return render(
        <MemoryRouter>
            <LocalizationContext.Provider value={localization}>
                <RsvpStatusContext.Provider value={status}>
                    <RsvpCtaSection section={section} event={weddingInvitation.event}
                                    capabilities={weddingInvitation.capabilities}/>
                </RsvpStatusContext.Provider>
            </LocalizationContext.Provider>
        </MemoryRouter>,
    )
}

describe('RsvpCtaSection', () => {
    it('tells the guest by when to reply, under the button', () => {
        // Given a call to action that declares the notice
        renderCta({deadlineNotice: NOTICE_KEY})

        // When the RSVP is open
        // Then the notice carries the formatted deadline, and the button comes first
        const notice = screen.getByText(COMPILED_NOTICE)
        expect(notice).toBeInTheDocument()
        expect(screen.getByRole('link', {name: 'rsvp.cta'}).compareDocumentPosition(notice))
            .toBe(Node.DOCUMENT_POSITION_FOLLOWING)
    })

    it('prints the deadline the panel moved, not the compiled one', () => {
        // Given a live status carrying a later deadline
        const live = '2027-06-01T23:59:59+02:00'

        // When the section renders
        renderCta({deadlineNotice: NOTICE_KEY}, {isOpen: true, deadlineUtc: live, override: null})

        // Then the guest reads the date the couple moved it to
        expect(screen.getByText(`Confírmanos antes del fecha(${live}).`)).toBeInTheDocument()
    })

    it('drops the notice once the RSVP has closed', () => {
        // Given a deadline the database reports as closed
        renderCta(
            {deadlineNotice: NOTICE_KEY},
            {isOpen: false, deadlineUtc: DEADLINE, override: 'closed'},
        )

        // Then the button says so and no date contradicts it
        expect(screen.getByRole('link', {name: 'rsvp.closed.cta'})).toBeInTheDocument()
        expect(screen.queryByText(`Confírmanos antes del fecha(${DEADLINE}).`)).not.toBeInTheDocument()
    })

    it('renders no notice when the invitation declares none', () => {
        // Given a call to action without the optional key
        renderCta({})

        // Then nothing but the button is offered
        expect(screen.getByRole('link', {name: 'rsvp.cta'})).toBeInTheDocument()
        expect(screen.queryByText(/Confírmanos antes del/)).not.toBeInTheDocument()
    })

    it('keeps the hashtag below the notice on the closing call', () => {
        // Given the closing instance, which is the one that prints the hashtag
        renderCta({deadlineNotice: NOTICE_KEY, closing: true})

        // Then the order down the page is button, date, hashtag
        const notice = screen.getByText(COMPILED_NOTICE)
        const hashtag = screen.getByText('event.hashtag')
        expect(notice.compareDocumentPosition(hashtag)).toBe(Node.DOCUMENT_POSITION_FOLLOWING)
    })
})

import type {SectionComponentProps} from '../../../app/invitation'
import {useLocalization} from '../../../app/providers/useLocalization'

const HEADING_ID = 'landing-lodging-heading'

/**
 * Where guests can stay, with a link straight to each place's own booking page.
 *
 * No empty-state guard: `validateInvitationDefinition` already rejects an enabled lodging
 * section with no items, exactly as it does for venue.
 */
export function LodgingSection<Message extends string>({
                                                           section,
                                                       }: Readonly<SectionComponentProps<Message, 'lodging'>>) {
    const {t} = useLocalization<Message>()

    return (
        <section className="landing-lodging" aria-labelledby={HEADING_ID}>
            <h2 id={HEADING_ID} className="landing-lodging-label">{t(section.content.label)}</h2>
            {section.content.noteKey && <p className="landing-lodging-note">{t(section.content.noteKey)}</p>}
            <div className="landing-lodging-grid">
                {section.content.items.map(item => {
                    const priceLabel = item.priceTier && section.content.priceTierLabels
                        ? t(section.content.priceTierLabels[item.priceTier])
                        : null
                    const name = t(item.name)
                    const bookingLabel = t(section.content.bookingLabel)
                    const newTabLabel = t(section.content.newTabLabel)

                    return (
                        <div key={item.id} className="landing-lodging-card card">
                            {item.highlightKey && (
                                <p className="landing-lodging-highlight">{t(item.highlightKey)}</p>
                            )}
                            <p className="landing-lodging-name">{name}</p>
                            {item.address && <p className="landing-lodging-address">{t(item.address)}</p>}
                            {priceLabel && <p className="landing-lodging-price">{priceLabel}</p>}
                            {item.noteKey && <p className="landing-lodging-item-note">{t(item.noteKey)}</p>}
                            <a
                                href={item.bookingUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="landing-lodging-book btn btn--outline"
                                // The engine opens external links in a new tab everywhere but never
                                // says so; a screen reader user only finds out after navigating.
                                aria-label={`${name} — ${bookingLabel} (${newTabLabel})`}
                            >
                                {bookingLabel}
                            </a>
                        </div>
                    )
                })}
            </div>
        </section>
    )
}

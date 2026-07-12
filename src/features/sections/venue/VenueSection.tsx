import type {SectionComponentProps} from '../../../app/invitation'
import {useLocalization} from '../../../app/providers/useLocalization'

export function VenueSection<Message extends string>({section}: Readonly<SectionComponentProps<Message, 'venue'>>) {
    const {t} = useLocalization<Message>()
    return (
        <section className="landing-venue">
            <p className="landing-venue-label">{t(section.content.label)}</p>
            <div className="landing-venue-grid">
                {section.content.items.map(item => (
                    <div key={item.id} className="landing-venue-card card">
                        <p className="landing-venue-type">{t(item.typeLabel)}</p>
                        <p className="landing-venue-name">{t(item.name)}</p>
                        {item.time && <p className="landing-venue-time">{item.time}</p>}
                        {item.address && <p className="landing-venue-address">{t(item.address)}</p>}
                        {item.mapsQuery && (
                            <a href={`https://maps.google.com/maps?q=${encodeURIComponent(item.mapsQuery)}`} target="_blank" rel="noopener noreferrer" className="landing-venue-map btn btn--outline">
                                {t(section.content.mapLabel)}
                            </a>
                        )}
                    </div>
                ))}
            </div>
        </section>
    )
}

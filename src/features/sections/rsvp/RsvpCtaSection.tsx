import {Link} from 'react-router-dom'
import type {SectionComponentProps} from '../../../app/invitation'
import {useLocalization} from '../../../app/providers/useLocalization'
import {useRsvpAvailability} from '../../rsvp/hooks/useRsvpAvailability'

export function RsvpCtaSection<Message extends string>({
                                                           section,
                                                           event,
                                                           capabilities,
                                                       }: Readonly<SectionComponentProps<Message, 'rsvp-cta'>>) {
    const {t} = useLocalization<Message>()
    const isOpen = useRsvpAvailability(capabilities.rsvp)
    return (
        <section className="landing-cta">
            {isOpen ? (
                <Link to="/rsvp" className="landing-cta-btn btn btn--primary">
                    {t(section.content.label)}
                </Link>
            ) : (
                <button className="landing-cta-btn btn btn--primary" disabled>
                    {t(section.content.closedLabel)}
                </button>
            )}
            {event.hashtag && <p className="landing-hashtag">{event.hashtag}</p>}
        </section>
    )
}

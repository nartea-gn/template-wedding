import {useNavigate} from 'react-router-dom'
import type {SectionComponentProps} from '../../../app/invitation'
import {useLocalization} from '../../../app/providers/useLocalization'

export function RsvpCtaSection<Message extends string>({section, event}: Readonly<SectionComponentProps<Message, 'rsvp-cta'>>) {
    const navigate = useNavigate()
    const {t} = useLocalization<Message>()
    return (
        <section className="landing-cta">
            <button className="landing-cta-btn btn btn--primary" onClick={() => navigate('/rsvp')}>{t(section.content.label)}</button>
            {event.hashtag && <p className="landing-hashtag">{event.hashtag}</p>}
        </section>
    )
}

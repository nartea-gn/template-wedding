import type {SectionComponentProps} from '../../../app/invitation'
import {useLocalization} from '../../../app/providers/useLocalization'

export function HeroSection<Message extends string>({section, event}: Readonly<SectionComponentProps<Message, 'hero'>>) {
    const {t, formatDate} = useLocalization<Message>()
    const displayDate = formatDate(event.date, {year: 'numeric', month: 'long', day: 'numeric'})

    return (
        <section className="landing-hero">
            <h1 className="landing-title">
                {t(section.content.partnerOne)}
                <span className="landing-title-amp">&</span>
                {t(section.content.partnerTwo)}
            </h1>
            <p className="landing-subtitle">{t(section.content.subtitle)}</p>
            <p className="landing-date">{displayDate}</p>
        </section>
    )
}

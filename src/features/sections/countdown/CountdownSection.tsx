import {Fragment} from 'react'
import type {SectionComponentProps} from '../../../app/invitation'
import {useLocalization} from '../../../app/providers/useLocalization'
import {InterfaceIcon} from '../../../components/ui/InterfaceIcon'
import {useCountdown} from './useCountdown'

export function CountdownSection<Message extends string>({
                                                              section,
                                                              event,
                                                          }: Readonly<SectionComponentProps<Message, 'countdown'>>) {
    const {t} = useLocalization<Message>()
    const timeLeft = useCountdown(event.date)
    if (!timeLeft) return null

    const units = [
        {value: timeLeft.days, label: t(section.content.unitLabels.days)},
        {value: String(timeLeft.hours).padStart(2, '0'), label: t(section.content.unitLabels.hours)},
        {value: String(timeLeft.minutes).padStart(2, '0'), label: t(section.content.unitLabels.minutes)},
        {value: String(timeLeft.seconds).padStart(2, '0'), label: t(section.content.unitLabels.seconds)},
    ]

    return (
        <section className="landing-countdown" role="timer" aria-label={t(section.content.label)}>
            <p className="landing-countdown-label">{t(section.content.label)}</p>
            <div className="landing-countdown-row" aria-live="polite" aria-atomic="true">
                {units.map((item, index) => (
                    <Fragment key={item.label}>
                        <span className="landing-countdown-value"
                              style={{gridColumn: index * 2 + 1}}>{item.value}</span>
                        <span className="landing-countdown-unit-label"
                              style={{gridColumn: index * 2 + 1}}>{item.label}</span>
                        {index < units.length - 1
                            ? <span className="landing-countdown-sep" style={{gridColumn: index * 2 + 2}}>
                                <InterfaceIcon name="rings" className="landing-countdown-sep-icon"/>
                            </span>
                            : null}
                    </Fragment>
                ))}
            </div>
        </section>
    )
}

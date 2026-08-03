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
        <section className="landing-countdown">
            <p className="landing-countdown-label">{t(section.content.label)}</p>
            <div className="landing-countdown-row">
                {units.map((item, index) => (
                    <Fragment key={item.label}>
                        <div className="landing-countdown-item">
                            <div className="landing-countdown-unit">
                                <span className="landing-countdown-value">{item.value}</span>
                                <span className="landing-countdown-unit-label">{item.label}</span>
                            </div>
                        </div>
                        {index < units.length - 1 && <InterfaceIcon name="rings" className="landing-countdown-sep"/>}
                    </Fragment>
                ))}
            </div>
        </section>
    )
}

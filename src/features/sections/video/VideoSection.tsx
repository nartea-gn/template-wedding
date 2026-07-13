import type {SectionComponentProps} from '../../../app/invitation'
import {useLocalization} from '../../../app/providers/useLocalization'
import {VideoHero} from '../../../components/VideoHero'
import {InterfaceIcon} from '../../../components/ui/InterfaceIcon'

type Props<Message extends string> = SectionComponentProps<Message, 'video'> & { src: string }

export function VideoSection<Message extends string>({section, src}: Readonly<Props<Message>>) {
    const {t} = useLocalization<Message>()
    return (
        <>
            <div className="landing-ornament" aria-hidden="true">
                <span className="landing-ornament-line"/><InterfaceIcon name="ornament"
                                                                        className="landing-ornament-icon"/><span
                className="landing-ornament-line"/>
            </div>
            <section className="landing-video">
                <VideoHero src={src} label={t(section.content.label)} playLabel={t(section.content.playLabel)}/>
            </section>
        </>
    )
}

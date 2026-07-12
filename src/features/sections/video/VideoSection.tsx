import type {SectionComponentProps} from '../../../app/invitation'
import {useLocalization} from '../../../app/providers/useLocalization'
import {VideoHero} from '../../../components/VideoHero'

type Props<Message extends string> = SectionComponentProps<Message, 'video'> & {src: string}

export function VideoSection<Message extends string>({section, src}: Readonly<Props<Message>>) {
    const {t} = useLocalization<Message>()
    return (
        <>
            <div className="landing-ornament" aria-hidden="true">
                <span className="landing-ornament-line"/><span className="landing-ornament-icon">✦</span><span className="landing-ornament-line"/>
            </div>
            <section className="landing-video">
                <VideoHero src={src} label={t(section.content.label)} playLabel={t(section.content.playLabel)}/>
            </section>
        </>
    )
}

import {useRef, useState} from 'react'
import './VideoHero.css'
import {InterfaceIcon} from './ui/InterfaceIcon'

type Props = { src: string; label: string; playLabel: string }

export function VideoHero({src, label, playLabel}: Readonly<Props>) {
    const videoRef = useRef<HTMLVideoElement>(null)
    const [playing, setPlaying] = useState(false)

    const handlePlay = () => {
        const playPromise = videoRef.current?.play()
        if (playPromise) {
            playPromise
                .then(() => setPlaying(true))
                .catch(() => setPlaying(false))
        }
    }

    return (
        <div className="video-hero">
            <video
                ref={videoRef}
                src={src}
                controls={playing}
                playsInline
                preload="auto"
                aria-label={label}
                onEnded={() => setPlaying(false)}
            />
            {!playing && (
                <button className="play-btn" onClick={handlePlay} aria-label={playLabel}>
                    <InterfaceIcon name="play" className="play-btn-icon"/>
                </button>
            )}
        </div>
    )
}

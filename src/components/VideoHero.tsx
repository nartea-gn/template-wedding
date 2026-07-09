import {useRef, useState} from 'react'
import videoSrc from '../assets/video.mp4'
import './VideoHero.css'

export function VideoHero() {
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
                src={videoSrc}
                controls={playing}
                playsInline
                preload="auto"
                aria-label="Video de la pareja"
                onEnded={() => setPlaying(false)}
            />
            {!playing && (
                <button className="play-btn" onClick={handlePlay} aria-label="Reproducir video">
                    ▶
                </button>
            )}
        </div>
    )
}

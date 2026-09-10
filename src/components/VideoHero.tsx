import {type CSSProperties, useRef, useState} from 'react'
import './VideoHero.css'
import {InterfaceIcon} from './ui/InterfaceIcon'

type Props = {
    src: string
    poster?: string
    preload: 'none' | 'metadata' | 'auto'
    aspectRatio: `${number} / ${number}`
    label: string
    playLabel: string
    loadingLabel: string
    errorLabel: string
    /** Fecha del evento, ya formateada y localizada, para pintarla sobre el poster. */
    eventDate?: string
}

type FullscreenVideoElement = HTMLVideoElement & {
    webkitEnterFullscreen?: () => void
    webkitRequestFullscreen?: () => Promise<void> | void
}

function requestVideoFullscreen(video: FullscreenVideoElement) {
    if (video.requestFullscreen) {
        void video.requestFullscreen().catch(() => undefined)
        return
    }
    if (video.webkitRequestFullscreen) {
        const result = video.webkitRequestFullscreen()
        if (result instanceof Promise) void result.catch(() => undefined)
        return
    }
    video.webkitEnterFullscreen?.()
}

export function VideoHero({
                              src,
                              poster,
                              preload,
                              aspectRatio,
                              label,
                              playLabel,
                              loadingLabel,
                              errorLabel,
                              eventDate,
                          }: Readonly<Props>) {
    const videoRef = useRef<HTMLVideoElement>(null)
    const [hasStarted, setHasStarted] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [hasError, setHasError] = useState(false)

    const handlePlay = () => {
        const video = videoRef.current as FullscreenVideoElement | null
        if (!video) return
        setIsLoading(true)
        setHasError(false)
        // Touch screens get fullscreen: inline, the player is a stamp in a page the guest is
        // still scrolling. A desktop browser keeps it inline, where the video already has room
        // and taking over the screen would be an intrusion. Gating on webkitEnterFullscreen
        // instead only ever matched iOS Safari, so Android phones and tablets played inline.
        const wantsFullscreen = window.matchMedia('(pointer: coarse)').matches
        if (wantsFullscreen) requestVideoFullscreen(video)
        const playPromise = video.play()
        if (playPromise) {
            playPromise
                .catch(() => {
                    setIsLoading(false)
                    setHasStarted(false)
                    setHasError(true)
                })
        }
    }

    return (
        <div className="video-hero"
             style={{'--video-aspect-ratio': aspectRatio} as CSSProperties}>
            <video
                ref={videoRef}
                // Focusable programmatically but out of the natural tab order: the play button
                // that had focus is unmounted on playback, and focus must not fall to <body>.
                tabIndex={-1}
                src={src}
                poster={poster}
                controls={hasStarted}
                playsInline
                preload={preload}
                aria-label={label}
                onPlaying={() => {
                    setIsLoading(false)
                    setHasStarted(true)
                    requestAnimationFrame(() => videoRef.current?.focus())
                }}
                onEnded={() => setHasStarted(false)}
                onError={() => {
                    setIsLoading(false)
                    setHasStarted(false)
                    setHasError(true)
                }}
            />
            {!hasStarted && (
                <div className="video-hero-overlay">
                    {/* Texto real, no pixeles: se traduce con el catalogo, lo lee un lector de
                        pantalla y sale de `event.date`, asi que no puede contradecir al contrato. */}
                    {eventDate && <p className="video-hero-date">{eventDate}</p>}
                    <button type="button" className="play-btn" onClick={handlePlay} disabled={isLoading}
                            aria-label={isLoading ? loadingLabel : playLabel}>
                        {isLoading
                            ? <span className="video-loading-spinner" aria-hidden="true"/>
                            : <InterfaceIcon name="play" className="play-btn-icon"/>}
                    </button>
                    <span className="sr-only" role="status" aria-live="polite">
                        {isLoading ? loadingLabel : ''}
                    </span>
                    {hasError && <p className="video-error" role="alert">{errorLabel}</p>}
                </div>
            )}
        </div>
    )
}

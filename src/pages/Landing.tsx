import {useEffect, useState} from 'react'
import {useNavigate} from 'react-router-dom'
import {VideoHero} from '../components/VideoHero'
import {weddingConfig} from '../config/wedding.config'
import './Landing.css'

type TimeLeft = { days: number; hours: number; minutes: number; seconds: number }

function getTimeLeft(target: string): TimeLeft | null {
    const ms = new Date(target).getTime() - Date.now()
    if (ms <= 0) return null
    const s = Math.floor(ms / 1000)
    return {
        days: Math.floor(s / 86400),
        hours: Math.floor((s % 86400) / 3600),
        minutes: Math.floor((s % 3600) / 60),
        seconds: s % 60,
    }
}

function useCountdown(target: string): TimeLeft | null {
    const [timeLeft, setTimeLeft] = useState(() => getTimeLeft(target))
    useEffect(() => {
        const id = setInterval(() => setTimeLeft(getTimeLeft(target)), 1000)
        return () => clearInterval(id)
    }, [target])
    return timeLeft
}

export default function Landing() {
    const navigate = useNavigate()
    const eventDateTime = `${weddingConfig.date}T${weddingConfig.venue.ceremony.time}`
    const timeLeft = useCountdown(eventDateTime)

    const displayDate = new Date(eventDateTime).toLocaleDateString('es-ES', {
        year: 'numeric', month: 'long', day: 'numeric',
    })

    return (
        <main className="landing-page">

            {/* Hero Section */}
            <section className="landing-hero">
                <h1 className="landing-title">
                    {weddingConfig.partners.partner1}
                    <span className="landing-title-amp">&</span>
                    {weddingConfig.partners.partner2}
                </h1>
                <p className="landing-subtitle">
                    {weddingConfig.invitation.subtitle}
                </p>
                <p className="landing-date">
                    {displayDate}
                </p>
            </section>

            {/* Countdown */}
            {weddingConfig.showCountdown && timeLeft && (
                <section className="landing-countdown">
                    <p className="landing-countdown-label">
                        Falta para el gran día
                    </p>
                    <div className="landing-countdown-row">
                        {[
                            {value: timeLeft.days, label: 'días'},
                            {value: String(timeLeft.hours).padStart(2, '0'), label: 'horas'},
                            {value: String(timeLeft.minutes).padStart(2, '0'), label: 'minutos'},
                            {value: String(timeLeft.seconds).padStart(2, '0'), label: 'segundos'},
                        ].map((item, index, arr) => (
                            <div key={item.label} className="landing-countdown-item">
                                <div className="landing-countdown-unit">
                                    <span className="landing-countdown-value">
                                        {item.value}
                                    </span>
                                    <span className="landing-countdown-unit-label">
                                        {item.label}
                                    </span>
                                </div>
                                {index < arr.length - 1 && (
                                    <span className="landing-countdown-sep">
                                        :
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Ornament */}
            <div className="landing-ornament" aria-hidden="true">
                <span className="landing-ornament-line"/>
                <span className="landing-ornament-icon">✦</span>
                <span className="landing-ornament-line"/>
            </div>

            {/* Video */}
            <section className="landing-video">
                <VideoHero/>
            </section>

            {/* Venue */}
            {weddingConfig.showVenue && (
                <section className="landing-venue">
                    <p className="landing-venue-label">
                        La celebración
                    </p>
                    <div className="landing-venue-grid">
                        {(['ceremony', 'reception'] as const).map((key) => {
                            const item = weddingConfig.venue[key]
                            return (
                                <div key={key} className="landing-venue-card card">
                                    <p className="landing-venue-type">
                                        {key === 'ceremony' ? 'Ceremonia' : 'Recepción'}
                                    </p>
                                    <p className="landing-venue-name">
                                        {item.name}
                                    </p>
                                    {item.time && (
                                        <p className="landing-venue-time">
                                            {item.time}
                                        </p>
                                    )}
                                    {item.address && (
                                        <p className="landing-venue-address">
                                            {item.address}
                                        </p>
                                    )}
                                    {item.mapsQuery && (
                                        <a
                                            href={`https://maps.google.com/maps?q=${encodeURIComponent(item.mapsQuery)}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="landing-venue-map btn btn--outline"
                                        >
                                            Ver en el mapa
                                        </a>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </section>
            )}

            {/* CTA */}
            <section className="landing-cta">
                <button
                    className="landing-cta-btn btn btn--primary"
                    onClick={() => navigate('/rsvp')}
                >
                    {weddingConfig.invitation.rsvpButtonText}
                </button>
                {weddingConfig.hashtag && (
                    <p className="landing-hashtag">
                        {weddingConfig.hashtag}
                    </p>
                )}
            </section>
        </main>
    )
}

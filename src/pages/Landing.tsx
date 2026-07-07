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
        <main className="landing">

            <section className="landing__hero">
                <h1 className="landing__names">
                    {weddingConfig.partners.partner1}
                    <span className="landing__ampersand"> & </span>
                    {weddingConfig.partners.partner2}
                </h1>
                <p className="landing__tagline">Celebra con nosotros</p>
                <p className="landing__date">{displayDate}</p>
            </section>

            <div className="landing__ornament" aria-hidden="true">
                <span className="landing__ornament-line"/>
                <span className="landing__ornament-gem">✦</span>
                <span className="landing__ornament-line"/>
            </div>

            <section className="landing__video">
                <VideoHero/>
            </section>

            {weddingConfig.showVenue && (
                <section className="landing__venue">
                    <p className="landing__section-label">La celebración</p>
                    <div className="landing__venue-grid">
                        {(['ceremony', 'reception'] as const).map((key) => {
                            const item = weddingConfig.venue[key]
                            return (
                                <div key={key} className="venue-card">
                                    <p className="venue-card__label">{key === 'ceremony' ? 'Ceremonia' : 'Recepción'}</p>
                                    <p className="venue-card__name">{item.name}</p>
                                    {item.time && <p className="venue-card__time">{item.time}</p>}
                                    {item.address && <p className="venue-card__address">{item.address}</p>}
                                    {item.mapsQuery && (
                                        <a
                                            href={`https://maps.google.com/maps?q=${encodeURIComponent(item.mapsQuery)}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="btn btn--primary venue-card__map-btn"
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

            {weddingConfig.showCountdown && timeLeft && (
                <section className="landing__countdown">
                    <p className="landing__countdown-label">Falta para el gran día</p>
                    <div className="landing__countdown-units">
                        <div className="landing__countdown-unit">
                            <span className="landing__countdown-number">{timeLeft.days}</span>
                            <span className="landing__countdown-unit-label">días</span>
                        </div>
                        <span className="landing__countdown-sep" aria-hidden="true">:</span>
                        <div className="landing__countdown-unit">
                            <span className="landing__countdown-number">{String(timeLeft.hours).padStart(2, '0')}</span>
                            <span className="landing__countdown-unit-label">horas</span>
                        </div>
                        <span className="landing__countdown-sep" aria-hidden="true">:</span>
                        <div className="landing__countdown-unit">
                            <span
                                className="landing__countdown-number">{String(timeLeft.minutes).padStart(2, '0')}</span>
                            <span className="landing__countdown-unit-label">minutos</span>
                        </div>
                        <span className="landing__countdown-sep" aria-hidden="true">:</span>
                        <div className="landing__countdown-unit">
                            <span
                                className="landing__countdown-number">{String(timeLeft.seconds).padStart(2, '0')}</span>
                            <span className="landing__countdown-unit-label">segundos</span>
                        </div>
                    </div>
                </section>
            )}

            <section className="landing__cta">
                <button className="btn btn--primary" onClick={() => navigate('/rsvp')}>
                    Confirmar asistencia
                </button>
                {weddingConfig.hashtag && (
                    <p className="landing__hashtag">{weddingConfig.hashtag}</p>
                )}
            </section>
        </main>
    )
}

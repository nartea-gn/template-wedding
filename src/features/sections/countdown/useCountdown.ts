import {useEffect, useState} from 'react'

/**
 * Three states rather than a number that vanishes.
 *
 * `today` starts at the ceremony instant, so the countdown is actually seen reaching zero, and
 * ends when the natural day closes **in the wedding's timezone** — a relative in Argentina must
 * not read "today is the day" when it is already tomorrow in Madrid.
 */
export type TimeLeft =
    | { status: 'pending'; days: number; hours: number; minutes: number; seconds: number }
    | { status: 'today' }
    | { status: 'past' }

function getLocalDateKey(timestamp: number, timeZone: string): string {
    return new Intl.DateTimeFormat('en-CA', {timeZone, year: 'numeric', month: '2-digit', day: '2-digit'}).format(timestamp)
}

export function getTimeLeft(target: string, timeZone: string): TimeLeft {
    const now = Date.now()
    const milliseconds = new Date(target).getTime() - now
    if (milliseconds > 0) {
        const seconds = Math.floor(milliseconds / 1000)
        return {
            status: 'pending',
            days: Math.floor(seconds / 86400),
            hours: Math.floor((seconds % 86400) / 3600),
            minutes: Math.floor((seconds % 3600) / 60),
            seconds: seconds % 60,
        }
    }
    const sameDay = getLocalDateKey(new Date(target).getTime(), timeZone) === getLocalDateKey(now, timeZone)
    return sameDay ? {status: 'today'} : {status: 'past'}
}

export function useCountdown(target: string, timeZone: string): TimeLeft {
    const [timeLeft, setTimeLeft] = useState(() => getTimeLeft(target, timeZone))
    useEffect(() => {
        // Only `pending` ticks: nothing changes every second once the day has arrived.
        if (timeLeft.status !== 'pending') return
        const intervalId = window.setInterval(() => setTimeLeft(getTimeLeft(target, timeZone)), 1000)
        return () => window.clearInterval(intervalId)
    }, [target, timeZone, timeLeft.status])
    return timeLeft
}

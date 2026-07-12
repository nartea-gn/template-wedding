import {useEffect, useState} from 'react'

export type TimeLeft = {days: number; hours: number; minutes: number; seconds: number}

function getTimeLeft(target: string): TimeLeft | null {
    const milliseconds = new Date(target).getTime() - Date.now()
    if (milliseconds <= 0) return null
    const seconds = Math.floor(milliseconds / 1000)
    return {
        days: Math.floor(seconds / 86400),
        hours: Math.floor((seconds % 86400) / 3600),
        minutes: Math.floor((seconds % 3600) / 60),
        seconds: seconds % 60,
    }
}

export function useCountdown(target: string): TimeLeft | null {
    const [timeLeft, setTimeLeft] = useState(() => getTimeLeft(target))
    useEffect(() => {
        const intervalId = window.setInterval(() => setTimeLeft(getTimeLeft(target)), 1000)
        return () => window.clearInterval(intervalId)
    }, [target])
    return timeLeft
}

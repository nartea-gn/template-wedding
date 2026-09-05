import {afterEach, describe, expect, it, vi} from 'vitest'
import {act, renderHook} from '@testing-library/react'
import {getTimeLeft, useCountdown} from './useCountdown'

const MADRID = 'Europe/Madrid'
const CEREMONY = '2027-06-12T12:00:00+02:00'

afterEach(() => {
    vi.useRealTimers()
})

function freezeAt(instant: string) {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(instant))
}

describe('getTimeLeft', () => {
    it('counts down while the ceremony is still ahead', () => {
        freezeAt('2027-06-11T10:00:00Z')

        const result = getTimeLeft(CEREMONY, MADRID)

        expect(result.status).toBe('pending')
        expect(result).toMatchObject({days: 1, hours: 0, minutes: 0, seconds: 0})
    })

    it('celebrates from the ceremony instant onwards', () => {
        freezeAt('2027-06-12T10:00:01Z')

        expect(getTimeLeft(CEREMONY, MADRID).status).toBe('today')
    })

    it('keeps celebrating late that same evening in the wedding timezone', () => {
        freezeAt('2027-06-12T21:30:00Z')

        expect(getTimeLeft(CEREMONY, MADRID).status).toBe('today')
    })

    it('stops once the natural day closes in the wedding timezone, not the guest one', () => {
        // 00:30 on the 13th in Madrid, still the 12th in Buenos Aires.
        freezeAt('2027-06-12T22:30:00Z')

        expect(getTimeLeft(CEREMONY, MADRID).status).toBe('past')
    })
})

describe('useCountdown', () => {
    it('ticks every second while pending', () => {
        freezeAt('2027-06-12T09:59:57Z')
        const {result} = renderHook(() => useCountdown(CEREMONY, MADRID))

        expect(result.current.status).toBe('pending')

        act(() => {
            vi.advanceTimersByTime(3000)
        })

        expect(result.current.status).toBe('today')
    })

    it('stops the timer once the day has arrived', () => {
        freezeAt('2027-06-12T12:00:00Z')
        const clearInterval = vi.spyOn(window, 'clearInterval')
        const {result, unmount} = renderHook(() => useCountdown(CEREMONY, MADRID))

        expect(result.current.status).toBe('today')

        unmount()

        expect(clearInterval).not.toHaveBeenCalled()
    })
})

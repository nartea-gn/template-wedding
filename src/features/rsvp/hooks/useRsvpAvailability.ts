import {useEffect, useState} from 'react'
import type {InvitationCapabilities} from '../../../core/invitation'
import {isRsvpOpen, parseInstant} from '../../../core/invitation'
import {useRsvpStatus} from './useRsvpStatus'

const MAX_TIMEOUT_MS = 2_147_000_000

/**
 * Whether the RSVP form should be offered.
 *
 * The value compiled into the invitation drives the first render and keeps the local timer
 * running; once the database answers through {@link RsvpStatusProvider}, its verdict wins — that
 * is what lets the couple open or close the form from their panel without a redeploy.
 */
export function useRsvpAvailability<Message extends string>(
    capability: InvitationCapabilities<Message>['rsvp'],
): boolean {
    const [isOpen, setIsOpen] = useState(() => isRsvpOpen(capability))
    const liveStatus = useRsvpStatus()
    const enabled = capability?.enabled === true
    const deadline = liveStatus?.deadlineUtc ?? capability?.deadline

    useEffect(() => {
        if (!enabled || !deadline) return
        const deadlineTimestamp = parseInstant(deadline)
        if (deadlineTimestamp === null || deadlineTimestamp <= Date.now()) return

        let timeoutId: number
        const schedule = () => {
            const remaining = deadlineTimestamp - Date.now()
            if (remaining <= 0) {
                setIsOpen(false)
                return
            }
            timeoutId = window.setTimeout(schedule, Math.min(remaining, MAX_TIMEOUT_MS))
        }

        schedule()
        return () => window.clearTimeout(timeoutId)
    }, [deadline, enabled])

    if (!enabled) return false
    return liveStatus ? liveStatus.isOpen : isOpen
}

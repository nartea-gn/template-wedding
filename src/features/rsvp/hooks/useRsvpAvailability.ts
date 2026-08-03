import {useEffect, useState} from 'react'
import type {InvitationCapabilities} from '../../../core/invitation'
import {isRsvpOpen, parseInstant} from '../../../core/invitation'

const MAX_TIMEOUT_MS = 2_147_000_000

export function useRsvpAvailability<Message extends string>(
    capability: InvitationCapabilities<Message>['rsvp'],
): boolean {
    const [isOpen, setIsOpen] = useState(() => isRsvpOpen(capability))
    const enabled = capability?.enabled === true
    const deadline = capability?.deadline

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

    return isOpen
}

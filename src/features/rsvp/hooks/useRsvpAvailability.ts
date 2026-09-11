import {useEffect, useState} from 'react'
import type {InvitationCapabilities} from '../../../core/invitation'
import {isRsvpOpen, parseInstant} from '../../../core/invitation'
import {useRsvpStatus} from './useRsvpStatus'

const MAX_TIMEOUT_MS = 2_147_000_000

/**
 * Whether the RSVP form should be offered.
 *
 * Three inputs decide it, in this order:
 *
 * 1. a manual `'open'` override, which the couple set deliberately and which no clock may undo;
 * 2. the deadline, watched by a local timer so a tab left open closes the form at the instant it
 *    expires rather than at the next reload;
 * 3. the verdict from {@link RsvpStatusProvider}, falling back to the deadline compiled into the
 *    invitation while the database has not answered.
 *
 * The timer used to be dead code. It set a `false` that the return statement then discarded
 * whenever a live status existed -- and `RsvpStatusProvider` wraps the whole application, so in
 * production a live status almost always exists. Only the tests, which render the hook with no
 * provider, ever took the branch that observed it.
 */
/**
 * The deadline instant to show the guest, or `undefined` when there is no RSVP to show it for.
 *
 * The same one {@link useRsvpAvailability} decides with: the database's once it has answered, the
 * one compiled into the invitation while it has not. So a deadline the couple moves from the panel
 * moves the date the landing prints, without a redeploy.
 *
 * A manual `'open'` override does not blank it. The switch decides whether the form accepts
 * answers; the date is still the one the couple wants to communicate.
 */
export function useRsvpDeadline<Message extends string>(
    capability: InvitationCapabilities<Message>['rsvp'],
): string | undefined {
    const liveStatus = useRsvpStatus()
    if (capability?.enabled !== true) return undefined
    return liveStatus?.deadlineUtc ?? capability?.deadline
}

export function useRsvpAvailability<Message extends string>(
    capability: InvitationCapabilities<Message>['rsvp'],
): boolean {
    const liveStatus = useRsvpStatus()
    const enabled = capability?.enabled === true
    const forcedOpen = liveStatus?.override === 'open'
    const deadline = liveStatus?.deadlineUtc ?? capability?.deadline
    const deadlineTimestamp = deadline ? parseInstant(deadline) : null
    // Which deadline the timer has seen expire. Keyed by the instant rather than a boolean, so a
    // later deadline arriving from the panel reopens the form on its own: the stored instant
    // stops matching the one being watched, and nothing has to reset it.
    const [elapsed, setElapsed] = useState<number | null>(null)
    const deadlinePassed = deadlineTimestamp !== null && elapsed === deadlineTimestamp

    useEffect(() => {
        if (!enabled || forcedOpen || deadlineTimestamp === null) return

        // The first evaluation is deferred by a zero-delay timeout rather than run inline: the
        // clock belongs in a callback, not in the body of an effect or of a render.
        let timeoutId = window.setTimeout(function tick() {
            const remaining = deadlineTimestamp - Date.now()
            if (remaining <= 0) {
                setElapsed(deadlineTimestamp)
                return
            }
            timeoutId = window.setTimeout(tick, Math.min(remaining, MAX_TIMEOUT_MS))
        }, 0)

        return () => window.clearTimeout(timeoutId)
    }, [deadlineTimestamp, enabled, forcedOpen])

    if (!enabled) return false
    if (forcedOpen) return true
    if (deadlinePassed) return false
    return liveStatus ? liveStatus.isOpen : isRsvpOpen(capability)
}

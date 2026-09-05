import {useEffect, useState, type ReactNode} from 'react'
import {RsvpStatusContext} from './RsvpStatusContext'
import {getRsvpStatus} from '../application/getRsvpStatus'
import type {RsvpRepository} from '../domain/RsvpRepository'
import type {RsvpStatus} from '../domain/RsvpStatus'
import {devWarn} from '../../../lib/devLog'

type Props = {
    repository: RsvpRepository
    invitationId: string
    children: ReactNode
}

/**
 * Resolves the live RSVP schedule once per visit and shares it with every consumer, so the
 * landing CTA and the RSVP page can never disagree about whether the form is open.
 *
 * Revalidation is non-blocking on purpose: the first render uses the deadline compiled into the
 * invitation, the database answer replaces it when it arrives, and a failure leaves the
 * compiled value in place with no error shown to the guest. Failing open is safe because the
 * authority is the INSERT policy, not this hook — a genuinely late submission is rejected by
 * the database and the guest is told so.
 */
export function RsvpStatusProvider({repository, invitationId, children}: Props) {
    const [status, setStatus] = useState<RsvpStatus | null>(null)

    useEffect(() => {
        let active = true
        getRsvpStatus(repository, invitationId)
            .then(resolved => {
                if (active) setStatus(resolved)
            })
            .catch(cause => devWarn('Falling back to the compiled RSVP deadline', cause))
        return () => {
            active = false
        }
    }, [repository, invitationId])

    return <RsvpStatusContext.Provider value={status}>{children}</RsvpStatusContext.Provider>
}

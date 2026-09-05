import {useContext} from 'react'
import {RsvpStatusContext} from './RsvpStatusContext'
import type {RsvpStatus} from '../domain/RsvpStatus'

/** Live RSVP schedule, or `null` while it is unknown. */
export function useRsvpStatus(): RsvpStatus | null {
    return useContext(RsvpStatusContext)
}

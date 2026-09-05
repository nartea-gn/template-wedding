import {createContext} from 'react'
import type {RsvpStatus} from '../domain/RsvpStatus'

/**
 * Null until the database answers, and on every failure. Consumers fall back to the value
 * compiled into the invitation instead of blocking or failing closed.
 */
export const RsvpStatusContext = createContext<RsvpStatus | null>(null)

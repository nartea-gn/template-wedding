import {supabaseAnonKey, supabaseUrl} from './supabaseConfig'
import {RsvpUnregisteredError} from '../features/rsvp/domain/RsvpUnregisteredError'
import {toRsvpStatus, type RsvpStatusRow} from '../infrastructure/supabase/mappers/rsvpStatusMapper'
import type {RsvpStatus} from '../features/rsvp/domain/RsvpStatus'

/**
 * Reads the live RSVP schedule with `fetch` instead of `@supabase/supabase-js`.
 *
 * The landing page needs this one RPC and nothing else from the API. Reaching it through the
 * client library put `vendor-supabase` -- 199.8 KiB raw, 51 KiB gzipped -- on the modulepreload
 * list of the page every guest opens, to refresh a deadline the bundle already carries as a
 * compiled fallback. One unauthenticated POST costs nothing and keeps the library in the lazy
 * chunks of `/rsvp` and `/admin`, which genuinely need it.
 *
 * Deliberately session-less, like `supabasePublic`: this is a public read.
 */
export async function fetchRsvpStatus(invitationId: string): Promise<RsvpStatus> {
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/get_rsvp_status`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            apikey: supabaseAnonKey,
            Authorization: `Bearer ${supabaseAnonKey}`,
        },
        body: JSON.stringify({p_wedding_slug: invitationId}),
    })

    if (!response.ok) {
        throw new Error(`get_rsvp_status answered ${response.status}`)
    }

    const rows = await response.json() as RsvpStatusRow[] | null
    const row = rows?.[0]
    if (!row) throw new RsvpUnregisteredError()
    return toRsvpStatus(row)
}

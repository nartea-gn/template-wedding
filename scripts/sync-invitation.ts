/**
 * Review §8.5 and §12.4 — publishes this wedding's calendar metadata to Supabase.
 *
 * The deploy pipeline is the only place that knows both the wedding configuration and the
 * target Supabase project at the same moment, so it is where `invitations.event_date_utc` gets
 * populated. Without this row the nightly purge of §8.1 never reaches this wedding's responses,
 * and `is_rsvp_open` returns NULL, which closes the RSVP.
 *
 * Import path matters: `src/invitations/wedding/index.ts` re-exports the section registry,
 * which pulls in React components and their CSS imports. `invitation.ts` only imports plain
 * object literals, so it runs outside Vite.
 */
import {createClient} from '@supabase/supabase-js'
import {weddingInvitation} from '../src/invitations/wedding/invitation'

const DUPLICATE_KEY = '23505'

const supabaseUrl = process.env.SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.')
}

/**
 * Redeploys of an already registered wedding are signalled by the pipeline. A first deploy runs
 * as a plain INSERT so the primary key rejects a slug that another wedding already owns, rather
 * than silently overwriting its date, deadline and open/closed state (§12.4).
 */
const allowUpdate = process.env.NARTEA_WEDDING_REGISTERED === 'true'

const supabase = createClient(supabaseUrl, serviceRoleKey)
const weddingSlug = weddingInvitation.id
const eventDateUtc = new Date(weddingInvitation.event.date).toISOString()

const {error} = await supabase.from('invitations').insert({
    wedding_slug: weddingSlug,
    event_date_utc: eventDateUtc,
})

if (error && error.code === DUPLICATE_KEY) {
    if (!allowUpdate) {
        throw new Error(
            `The wedding_slug "${weddingSlug}" is already registered in Supabase.\n` +
            'If this is a redeploy of that same wedding, set NARTEA_WEDDING_REGISTERED=true.\n' +
            'If it is a different wedding, choose a distinct id — never reuse a slug, and never ' +
            'add a numeric suffix automatically: two admins would end up sharing one partition.',
        )
    }
    // Only the wedding date is resynchronised. `rsvp_deadline_utc` and `rsvp_override` are
    // owned by the couple's panel from this point on, and a redeploy must not clobber them.
    const {error: updateError} = await supabase.from('invitations')
        .update({event_date_utc: eventDateUtc})
        .eq('wedding_slug', weddingSlug)
    if (updateError) throw updateError
    console.log(`invitations.event_date_utc resynchronised for "${weddingSlug}"`)
} else if (error) {
    throw error
} else {
    console.log(`invitations row created for "${weddingSlug}"`)
}

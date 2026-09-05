/**
 * Review §8.4 — warns every admin of a wedding whose RSVP retention is about to expire.
 *
 * Invoked nightly by the `send-purge-warnings-daily` cron job (pg_cron + pg_net). A wedding is
 * only marked as warned when every one of its admin emails was accepted by Resend: marking it
 * blindly would turn a rejected delivery into a deletion with no warning at all.
 */
import {createClient} from 'https://esm.sh/@supabase/supabase-js@2.110.2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const WARNING_SENDER = Deno.env.get('PURGE_WARNING_SENDER') ?? 'avisos@example.invalid'

/**
 * Four days rather than two: with a single nightly retry, two days leaves no slack if Resend
 * rejects the delivery on two consecutive nights.
 */
const WARNING_DAYS_BEFORE = 4

type PendingWarning = {
    wedding_slug: string
    admin_email: string
    purge_date: string
}

Deno.serve(async () => {
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)
    const {data, error} = await supabase.rpc('get_pending_purge_warnings', {p_days_before: WARNING_DAYS_BEFORE})
    if (error) return new Response(error.message, {status: 500})

    const pending = (data ?? []) as PendingWarning[]
    const bySlug = new Map<string, PendingWarning[]>()
    for (const row of pending) {
        const rows = bySlug.get(row.wedding_slug) ?? []
        rows.push(row)
        bySlug.set(row.wedding_slug, rows)
    }

    const failed: string[] = []

    for (const [slug, rows] of bySlug) {
        const purgeDate = new Date(rows[0].purge_date).toLocaleDateString('es-ES')
        let allDelivered = true

        for (const row of rows) {
            const response = await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: {Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json'},
                body: JSON.stringify({
                    from: WARNING_SENDER,
                    to: row.admin_email,
                    subject: `Tus datos de RSVP (${slug}) se purgan el ${purgeDate}`,
                    html: `<p>La retención de las respuestas RSVP de <strong>${slug}</strong> vence el ${purgeDate}. Descárgalas en CSV desde el panel de administración antes de esa fecha si quieres conservarlas — después no hay forma de recuperarlas.</p>`,
                }),
            })
            if (!response.ok) {
                allDelivered = false
                console.error(`Resend rejected the warning for ${slug}: ${response.status} ${await response.text()}`)
            }
        }

        if (allDelivered) {
            await supabase.from('invitations')
                .update({purge_warning_sent_at: new Date().toISOString()})
                .eq('wedding_slug', slug)
        } else {
            failed.push(slug)
        }
    }

    // Returning 500 makes the problem visible in the pg_net logs, and the next nightly run
    // retries the weddings that were never marked.
    return failed.length === 0
        ? new Response('ok')
        : new Response(`failed: ${failed.join(', ')}`, {status: 500})
})

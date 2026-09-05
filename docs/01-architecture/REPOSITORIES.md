# Repositories

Features depend on repository contracts, never on Supabase. `RsvpRepository` exposes submission, invitation-scoped
listing, the administrative mutations (`update`, `softDelete`, `restore`), and the live RSVP schedule (`getStatus`,
`updateSchedule`); `SupabaseRsvpRepository` implements that contract under `infrastructure`.

There is no `purgeExpired`: retention is a nightly database job keyed on the wedding date, not something a client
triggers by opening the admin panel.

The invitation composition root selects the implementation. Pages call application functions or feature hooks and do not
import the Supabase client.

RSVP storage uses versioned generic metadata (`form_id`, `form_version`, `locale`, `answers`). The flat legacy columns
are derived from `answers` by a database trigger, so they cannot drift depending on which client wrote the row.

The generic repository never names a form field. Each invitation supplies its own mapper for the legacy columns and its
own reader for rows stored before `answers` existed (`invitations/wedding/rsvpColumns.ts`), so a form whose guest field
is called something else does not break the table constraints.

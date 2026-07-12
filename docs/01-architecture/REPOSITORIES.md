# Repositories

Features depend on repository contracts, never on Supabase. `RsvpRepository` exposes submission and invitation-scoped listing; `SupabaseRsvpRepository` implements that contract under `infrastructure`.

The invitation composition root selects the implementation. Pages call application functions or feature hooks and do not import the Supabase client.

RSVP storage uses versioned generic metadata (`form_id`, `form_version`, `locale`, `answers`) while temporarily writing the legacy columns too. Existing rows are mapped into the new answer model when `answers` is absent. The migration is additive and must be applied before deploying the new client.

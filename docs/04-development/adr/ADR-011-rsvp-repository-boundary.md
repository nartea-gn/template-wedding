# ADR-011: RSVP repository boundary

- Status: Accepted
- Date: 2026-07-12

## Context

RSVP and Admin need persistence, but the product must not couple UI or Core to Supabase.

## Decision

Features consume `RsvpRepository`; infrastructure supplies `SupabaseRsvpRepository`. Persist generic versioned answers and keep an additive dual-write compatibility period for legacy columns.

## Consequences

Providers can be replaced at the composition boundary, old responses remain readable and migration risk stays low. The current client-side password and read policy remain a documented v1 limitation.

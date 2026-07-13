# Optional Admin

## Current scope — Sprint 5

Admin is an optional invitation capability backed by RSVP. It displays metrics, filters and columns declared by field
ID in `InvitationDefinition`; it does not own a second form schema.

The route exists only when both RSVP and Admin are enabled. `Admin` is loaded lazily, so invitations without that
capability do not download its page or Supabase composition module.

Current capabilities are read-only:

- localized metrics and filters;
- columns derived from the configured form;
- normalized current and legacy responses;
- loading, empty, error and retry states;
- responsive table with keyboard-accessible horizontal scrolling;
- client-side password gate accepted for v1.

## Current data flow

```text
Admin UI → useAdminData → listRsvpResponses → RsvpRepository → Supabase adapter
```

The adapter normalizes versioned `answers JSONB` rows and legacy rows mapped from the original columns. Columns, option
labels and metrics use the current form definition. Unknown historical values remain visible as plain text.

## Sprint 5.1A — Read-only Admin operations

Sprint 5.1A adds optional read-only operations without turning Admin into a guest-management CRM. Configuration decides
whether each control is available. The following shape is illustrative and must be finalized in the implementation
plan; it is not a current contract:

```ts
admin: {
    controls: {
        export: {enabled: true, format: 'csv', scope: 'visible'},
        search: {enabled: true},
        sorting: {enabled: true},
        freshness: {enabled: true}
    }
}
```

### Export the presented table

CSV export operates on the Admin view model, not raw database rows. The first version exports:

- configured and visible columns in their displayed order;
- rows remaining after the active filter and search;
- localized headers and option labels;
- normalized legacy and current answers;
- UTF-8 content with correct CSV escaping and a deterministic invitation/date filename.

CSV is the only planned format for the first increment. XLSX is deferred until real demand justifies an additional
dependency and format-specific behavior.

### Search, sorting and freshness

- Search initially targets the configured identity field, normally the guest name.
- Sorting initially supports submission date and guest name.
- The interface displays the current result count and last successful refresh time.
- Filters, search, sorting and export operate on the same presented dataset so exported content matches the screen.

## Sprint 5.1B — Protected Admin operations

Sprint 5.1B introduces mutable invitation runtime state and cannot begin until its security dependencies are approved.
Configuration only determines whether hosts see the control; it does not contain the live state:

```ts
admin: {
    controls: {
        rsvpClosure: {enabled: true}
    }
}
```

### Open or close confirmations

The live state must be persisted per invitation and represented by a small model such as:

```text
status: open | closed
updatedAt: timestamp
```

When status is `closed`:

- the public confirmation CTA is not rendered;
- direct access to `#/rsvp` cannot submit and shows a localized closed message;
- the Admin displays the current state and last update;
- reopening restores the public flow without a deployment.

Public clients may read the status, but changing it is an administrative mutation. Sprint 5.1B must not enable
anonymous `UPDATE` policies or trust `VITE_ADMIN_PASSWORD`, because values bundled with Vite are public. The mutation
requires a server-validated operation, such as secure Admin authentication plus RLS or a protected server/Edge Function.
The exact mechanism requires its own architecture decision before implementation.

## Explicitly deferred Admin evolutions

- response detail optimized for mobile and long answers;
- XLSX export;
- editing or deleting submissions;
- audit history for administrative mutations;
- scheduled RSVP closure;
- advanced charts and analytics;
- notifications and bulk guest communication;
- full guest-list or seating management.

These items are tracked in [`PRODUCT_BACKLOG.md`](../00-product/PRODUCT_BACKLOG.md) and require separate approval.

## Operational checks

1. Submit one attending and one declined RSVP.
2. Open `#/admin` and refresh.
3. Confirm totals, attendance and transport metrics.
4. Check every filter and locale.
5. Test horizontal keyboard scrolling on narrow screens.
6. Simulate a repository failure and verify retry.

## Troubleshooting

- Missing response: verify `wedding_slug` matches the invitation ID.
- `PGRST204`: apply the pending database migration.
- Legacy row without values: inspect the mapper fallback and original snake_case columns.
- Wrong option label: stored values must match stable `FormOption.value` values.
- Route absent: verify RSVP and Admin capabilities are both enabled.

## Accepted v1 security limitation

The password is currently compared in the browser and anonymous SELECT remains enabled by the existing RLS policy. This
protects casual interface access, not the underlying API. The limitation is acceptable only while Admin remains
read-only. Supabase Auth or an equivalent server-validated operation and restrictive policies are prerequisites for
administrative mutations or sensitive production data.

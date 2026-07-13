# Product Backlog

## Purpose

This document is the single inventory of product evolutions that should not be lost. It is not a release commitment.
An item moves to the roadmap only after its value, dependencies and implementation plan are approved.

## Next — approved direction

### Sprint 5.1A: Read-only Admin operations

- Configurable CSV export of the currently presented Admin table.
- Guest search using the configured identity field.
- Sorting by submission date and guest name.
- Visible result count and last successful refresh time.

Dependencies:

- finalize the Admin capability contract;
- preserve the Repository boundary and provider independence.

### Sprint 5.1B: Protected Admin operations

- Optional open/close RSVP control.
- Persistent invitation runtime state with update timestamp.
- Localized public closed state that hides the CTA and prevents direct submission.
- Secure mutation with authorization scoped to the invitation.

Blocking dependencies:

- define the persistent invitation runtime-state contract;
- approve an architecture decision for protected mutations;
- introduce server-validated authentication or authorization;
- replace anonymous mutation access with restrictive policies.

### Sprint 6: Premium experience

- Refine visual hierarchy, responsive behavior and accessible interaction.
- Keep motion subtle and compatible with reduced-motion preferences.
- Optimize heavy media, especially the hero video, and measure the result.
- Use Lighthouse and real-device checks without adding business capabilities.

### Sprint 7: Release hardening

- Validate critical invitation, localization, RSVP and Admin flows.
- Add proportionate automated coverage after the contracts stabilize.
- Review keyboard use, accessibility, browser compatibility and offline/error states.
- Audit RLS, privacy, data retention, deployment and operational recovery.
- Complete configuration guidance, release checklist and changelog for `1.0.0`.
- Prioritize post-1.0 work from real usage and client feedback.

## Later — useful evolutions with a clear use case

### Admin security

- Replace the client-side password gate with Supabase Auth, magic links or an equivalent server-validated mechanism.
- Restrict read and write policies by invitation and authenticated host.
- Add session expiry, logout semantics and recovery appropriate to the chosen provider.
- Record an audit trail before enabling destructive or business-critical operations.

### Response experience

- Mobile-friendly response detail view for long or numerous answers.
- Pagination or server-side querying when real response volume makes client-side operations inadequate.
- Scheduled closing date with explicit timezone behavior.
- Optional notifications when a new response arrives.

### Export and reporting

- XLSX export only if clients need spreadsheets beyond interoperable CSV.
- Summary reports or charts only after defining decisions they help hosts make.
- Privacy-aware retention and deletion workflow before handling sensitive production data at scale.

### Guest management

- Editing or deleting a response with confirmation and audit history.
- Curated guest list, invitation codes or household grouping.
- Seating, menu totals or transport manifests as separate features, not additions to the Core Form Engine.

## Conditional — only after repeated demand

### Platform

- Visual invitation editor or SaaS control panel.
- Multi-tenant organizations, roles and billing.
- SDK, CLI, plugin marketplace or public extension API.
- Monorepo extraction into independently versioned packages.
- Additional event packages beyond weddings after a second real domain validates the abstractions.

### Operations

- Staging environments and preview deployments per invitation.
- Product analytics and operational observability.
- Automated visual regression testing and Storybook.
- Bulk email, messaging or CRM integrations.

## Prioritization rule

An evolution is promoted only when it provides measurable user or operator value, has an identified owner and respects
the configuration-driven Core. Generalize only after the same need appears in at least two real cases; security and data
integrity requirements are never deferred merely to accelerate delivery.

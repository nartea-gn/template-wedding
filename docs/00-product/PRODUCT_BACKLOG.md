# Product Backlog

## Purpose

This document is the single inventory of product evolutions that should not be lost. It is not a release commitment.
An item moves to the roadmap only after its value, dependencies and implementation plan are approved.

## Next — approved direction

### Sprint 5.1A: Read-only Admin operations — implemented and validated

- Configurable CSV export of the currently presented Admin table.
- Guest search using the configured identity field.
- Sorting by submission date and guest name.
- Configurable client-side pagination and optional page-size selector over the normalized result set.
- Visible result count and last successful refresh time.

Dependencies:

- finalize the Admin capability contract;
- preserve the Repository boundary and provider independence.
- revisit server-side query, counting and pagination only after measured scale requires it.

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

### Sprint 6.4: Theme Engine v2 — prioritized architectural evolution

- Evolve the typed theme contract beyond colors, typography, shadows and radius using requirements verified in Sprint 6.
- Support theme-owned motion, icon treatment, decoration and approved composition variants without moving business
  rules into themes.
- Preserve CSS-variable output and migration compatibility so existing invitations remain functional during adoption.
- Define the contract and migration through an RFC/ADR before changing implementations.

Dependencies:

- complete Sprint 6.1–6.3 and inventory the visual decisions that genuinely vary by theme;
- distinguish brand identity from event content, capability flags and section order;
- define backwards compatibility and migration criteria for the five current themes.

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

### Invitation content modules

- Deferred until after Theme Engine v2 and until a concrete client need is approved.
- Gallery as an optional registered section with configurable assets, layout and accessible captions.
- Story or timeline as an event-owned content module rendered through the existing Section Registry.
- Music as an optional capability with explicit playback consent and no autoplay by default.
- Additional section types only after their content contract and reuse boundary are defined; Core remains unchanged.

### Media workflow

- External image and video optimization guidance, budgets and validation before deployment.
- Automated media tooling only if repeated production use justifies ownership and maintenance.
- Self-hosted or per-invitation font packaging after performance and privacy measurements justify replacing the current
  loading strategy.

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

## Deferred-work traceability register

| Evolution                          | Destination                      | Activation condition                                                                         | Preparation preserved now                                                                                 |
|------------------------------------|----------------------------------|----------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------|
| Remote RSVP closure                | Sprint 5.1B                      | Server-validated authorization and restrictive policies approved                             | Admin control remains optional; runtime state is kept outside static invitation configuration             |
| Admin authentication and RLS       | Sprint 7 / Admin security        | Provider, session model and invitation-scoped authorization approved                         | Auth remains separated from Dashboard; repositories isolate data access                                   |
| Gallery, story and music           | Later invitation content modules | Theme Engine v2 is stable and a concrete client definition and content contract are approved | Section Registry and capability model accept new modules without changing Core orchestration              |
| Additional event packages          | Conditional platform evolution   | A second real event domain validates reusable abstractions                                   | Core localization, forms, sections and themes remain domain-neutral                                       |
| Theme Engine v2                    | Sprint 6.4 — prioritized         | Sprint 6.1–6.3 identify and document the visual dimensions that must vary                    | Current themes remain behind `ThemeDefinition` and CSS-variable output, enabling an incremental migration |
| Media automation                   | Media workflow                   | Repeated production volume makes manual optimization unreliable                              | Sprint 6.2 defines budgets and an external process before owning tooling                                  |
| Lighthouse target above 95         | Sprint 6.2 / Sprint 7            | Reproducible baseline and representative deployment exist                                    | Measurements are recorded before a numeric target becomes a release gate                                  |
| Third-party icon or motion library | Conditional design evolution     | Internal primitives cannot meet an identified accessible interaction                         | Sprint 6.1 uses small owned SVG primitives and existing reduced-motion support                            |
| XLSX, reports and charts           | Export and reporting             | Clients identify decisions CSV cannot support                                                | CSV stays provider-independent and presentation-based                                                     |
| Server-side response queries       | Response experience              | Measured volume or latency makes client-side processing inadequate                           | Repository boundary can be extended with query, count and range contracts                                 |

## Prioritization rule

An evolution is promoted only when it provides measurable user or operator value, has an identified owner and respects
the configuration-driven Core. Generalize only after the same need appears in at least two real cases; security and data
integrity requirements are never deferred merely to accelerate delivery.

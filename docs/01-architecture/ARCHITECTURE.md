# Architecture

## Current composition

`main.tsx → ThemeProvider → LocalizationProvider → AppRouter`.

The wedding invitation is an `InvitationDefinition` containing event metadata, localization, ordered sections, theme and
optional capabilities. `InvitationRenderer` resolves sections through a typed registry. RSVP and Admin routes are
registered only when their capabilities are enabled and are loaded lazily.

## Layers

| Layer            | Responsibility                                      | Must not know                                 |
|------------------|-----------------------------------------------------|-----------------------------------------------|
| `app`            | Bootstrap, providers, routing and composition       | Rules of a concrete event                     |
| `core`           | Framework-neutral contracts and pure validation     | React, weddings, Supabase or concrete styling |
| `design`         | Tokens, themes and visual foundations               | Business rules or persistence                 |
| `features`       | Reusable vertical capabilities                      | External providers directly                   |
| `infrastructure` | Supabase adapters and external integrations         | Visual composition                            |
| `invitations`    | Event definitions, catalogs and composition choices | Rendering implementation details              |
| `shared`         | Cross-cutting utilities                             | Invitations or product features               |

## Dependency rules

`invitations → core contracts`; `features → core + design`; `infrastructure → feature contracts`; `app` composes all
layers. Core never imports React, features or infrastructure. UI and feature hooks never import the Supabase client.

Localization is a Core capability configured by each invitation. Spanish is the default runtime locale; supported
locales are invitation data. Form labels and option labels use the same typed message catalogs.

## Persistence and deployment

RSVP uses a minimal `RsvpRepository`, implemented by `SupabaseRsvpRepository`. Form answers are persisted with form ID,
version and locale while legacy columns remain compatible during migration.

Cloudflare Pages is the static host, served from the site root, with real paths. The workflows stay in GitHub:
Actions validates the code, applies pending Supabase migrations and then publishes the built output to Cloudflare,
which builds nothing of its own. Splitting it that way keeps the quality gates -- migration harness, schema drift,
end-to-end tests -- on the side that can run them. Database administration never runs in the browser.

## Evolution rule

Generalize only after a capability is needed by more than one concrete use case. New event types should be expressible
through definitions and registered features without changing Core business assumptions.

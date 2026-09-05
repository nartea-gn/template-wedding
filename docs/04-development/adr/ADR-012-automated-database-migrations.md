# ADR-012: Automated database migrations before Pages deployment

- Status: Accepted
- Date: 2026-07-12


> **Nota del 2026-09-04.** El host pasó a Cloudflare Pages
> ([`ADR-021`](./ADR-021-cloudflare-pages-hosting.md)), así que el paso final del pipeline ya no
> despliega en Pages. El razonamiento de este ADR no cambia: un cliente estático sigue sin poder
> aplicar migraciones en runtime, y el orden —migrar antes de publicar el frontend que lo consume—
> es el mismo. El texto original se conserva tal cual, como registro de cuándo y por qué se decidió.

## Context

GitHub Pages deploys a static client and cannot safely apply database migrations at runtime. Deploying Form Engine
before its JSONB migration caused PostgREST error `PGRST204`.

## Decision

GitHub Actions validates the application, applies pending Supabase migrations through the official CLI and only then
deploys the built Pages artifact. Production database credentials remain GitHub Secrets.

## Consequences

Schema and application changes share one versioned release, migration failures block deployment and the browser receives
no administrative credentials. A staging project and local Docker remain optional future hardening, not v1 requirements.

## Sprint 7.1 clarification

The first tracked migration was adopted after the production table already existed. Remote metadata confirmed that only
version `20260712` was recorded. Its file therefore keeps the same version and adds an idempotent bootstrap for empty
projects; the existing project skips it, while fresh installations become reproducible. All later changes remain
immutable and additive.

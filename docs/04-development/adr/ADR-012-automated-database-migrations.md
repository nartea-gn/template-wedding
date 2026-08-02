# ADR-012: Automated database migrations before Pages deployment

- Status: Accepted
- Date: 2026-07-12

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

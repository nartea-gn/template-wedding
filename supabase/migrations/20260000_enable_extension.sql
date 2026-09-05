-- Extensions the later migrations depend on, enabled before any of them runs.
--
-- `20260901` schedules the nightly purge through `cron.schedule`, and `20260903` schedules the
-- warning job whose body calls `net.http_post`. Neither schema exists on a bare Postgres, so
-- applying this directory against a fresh database -- `supabase start`, `supabase db reset`, a new
-- project -- failed on the first `cron.` reference with `schema "cron" does not exist`.
--
-- Dated before the first migration on purpose: the version prefix is what orders the directory and
-- this file has to run first. Nothing is deployed yet, so choosing a version earlier than the
-- others costs nothing here; on a project that already carries these migrations it would need
-- checking against what `supabase_migrations.schema_migrations` already records.
--
-- Neither extension names a target schema. Both create their own -- `cron` and `net` -- and pg_net
-- refuses to adopt a `net` schema that already exists.
--
-- pgTAP is deliberately absent: it is a test dependency and belongs to the local harness
-- (`supabase/local/00-shims.sql`), not to a database that serves guests.

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

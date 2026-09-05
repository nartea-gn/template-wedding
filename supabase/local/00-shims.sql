-- Prepares the database for the migrations.
--
-- This runs the same Postgres image Supabase runs, so the API roles, `auth.users` and
-- `auth.uid()` already exist, and pg_cron, pg_net, supabase_vault and pgTAP are the real
-- extensions rather than stubs. Only two things are missing on a bare container: the extensions
-- a project enables from the dashboard, and the two Vault secrets the purge-warning job reads.

CREATE EXTENSION IF NOT EXISTS pg_cron;
-- pg_net creates its own `net` schema; pre-creating it makes the extension refuse to adopt it.
CREATE EXTENSION IF NOT EXISTS pg_net;
CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;

SELECT vault.create_secret('local-stub', 'service_role_key');
SELECT vault.create_secret('http://localhost:54321/functions/v1', 'functions_base_url');

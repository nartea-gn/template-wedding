# Database migrations

## Purpose

Supabase schema changes are versioned under `supabase/migrations` and released by GitHub Actions. This is the database
equivalent of Flyway/Liquibase: Supabase stores applied versions in `supabase_migrations.schema_migrations` and skips
them on subsequent deployments.

`supabase/config.toml` initializes the repository for Supabase CLI. Its `project_id` is only a local identifier; CI
links the real remote project from an encrypted secret.

React must never run migrations. Administrative credentials only exist in GitHub Secrets and are not exposed as `VITE_*`
variables.

## Estado de reproducibilidad

El repositorio contiene el esquema base en `supabase/schema.sql` y migraciones incrementales en
`supabase/migrations`. La primera migración versionada parte de una tabla ya existente; por tanto, una instalación
vacía no puede reconstruirse todavía ejecutando únicamente el historial de migraciones.

Esto es un bloqueo previo a `1.0.0`, no un motivo para inventar una migración retrospectiva. Antes de crear una
baseline se debe comparar el esquema remoto, `supabase_migrations.schema_migrations` y los proyectos ya desplegados.
Renombrar versiones o ejecutar `migration repair` sin esa auditoría puede desalinear producción.

## Production pipeline

On a push to `main`, `.github/workflows/deploy.yml` runs in this order:

1. install frozen dependencies;
2. lint;
3. build the frontend;
4. link Supabase CLI to the configured project;
5. apply pending migrations with `supabase db push`;
6. upload and deploy the previously built artifact to GitHub Pages.

A failed validation or migration stops deployment. The single `production` concurrency group prevents simultaneous
database releases.

## GitHub Secrets

Configure these repository secrets in **Settings → Secrets and variables → Actions**:

| Secret                  | Purpose                                           |
|-------------------------|---------------------------------------------------|
| `SUPABASE_ACCESS_TOKEN` | Personal token used only by Supabase CLI          |
| `SUPABASE_PROJECT_ID`   | Project reference from the Supabase dashboard URL |
| `SUPABASE_DB_PASSWORD`  | Database password used by `db push`               |
| `SUPABASE_URL`          | Public project URL injected into Vite             |
| `SUPABASE_ANON_KEY`     | Public anonymous key injected into Vite           |
| `ADMIN_PASSWORD`        | Current v1 browser-side Admin password            |

Only the last three frontend values are mapped to `VITE_*`. Never expose the access token or database password through
Vite.

## Creating a change

Create one immutable timestamped file per schema change:

```text
supabase/migrations/<timestamp>_<description>.sql
```

Prefer additive, backwards-compatible migrations. Review and commit the file with the application change. Do not edit a
migration after production has applied it; create a new one.

## Existing remote project

This repository adopted migrations after the initial table already existed. The first tracked migration therefore uses
`ADD COLUMN IF NOT EXISTS` and is safe against that baseline. Do not also apply it manually before the first automated
deployment. If it was already applied manually, run `supabase migration repair --status applied <version>` once before
enabling CI so schema and history agree.

## Troubleshooting

- `PGRST204` for a new column means the frontend was deployed before its migration.
- `supabase migration list` compares local and remote history.
- `supabase db push --dry-run` previews pending migrations.
- `migration repair` changes history only; use it only after confirming the real schema.
- Once this workflow is active, do not make production schema changes through Table Editor or SQL Editor.

## Trabajo obligatorio antes de 1.0.0

1. Exportar y comparar el esquema remoto real.
2. Auditar el historial aplicado en cada proyecto activo.
3. Diseñar una baseline para instalaciones vacías.
4. Definir cómo adoptar la baseline en instalaciones existentes sin reaplicar cambios.
5. Probar instalación limpia, actualización, fallo parcial y recuperación.
6. Documentar backup, rollback y responsable operativo.

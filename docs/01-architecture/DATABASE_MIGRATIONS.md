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

Las migraciones de `supabase/migrations` son la fuente ejecutable de verdad. `supabase/schema.sql` es un snapshot
**generado** por `pnpm run db:verify` desde las migraciones aplicadas; no se edita a mano y el workflow falla si queda
desincronizado. Antes se mantenía a mano y había divergido: le faltaban `updated_at`, `deleted_at` y `deleted_by`, así
que una instalación nueva desde ese archivo dejaba rotas la edición y el borrado.

La auditoría de Sprint 7.1 confirmó un único proyecto remoto y una única migración aplicada. Para preservar ese
historial sin `migration repair`, la migración `20260712` mantiene su versión y añade un bootstrap idempotente de la
tabla legacy antes de incorporar las columnas dinámicas. Producción la omite porque ya consta como aplicada; una
instalación vacía la ejecuta y puede reconstruirse desde cero.

La migración `20260802` aplica seguridad y autorización tanto sobre el proyecto existente como sobre una instalación
nueva. Esta modificación excepcional de una migración histórica está limitada al bootstrap que producción creó antes de
adoptar migraciones y no cambia el resultado de la versión ya aplicada.

La migración `20260711_enable_extensions` es anterior a todas y existe por una razón de orden: crea `pg_cron` y
`pg_net`, sin las cuales `20260901` y `20260903` fallan con `schema "cron" does not exist`. Antes las creaba el harness
local, que ocultaba el problema en local y lo dejaba escrito como paso manual del runbook. pgTAP no está ahí: es
dependencia de test y sigue en `supabase/local/00-shims.sql`.

### Migraciones posteriores a Sprint 7.1

| Migración | Qué introduce |
|---|---|
| `20260831_fix_rsvp_update_policies` | Una sola policy de `UPDATE` —dos permisivas sobre el mismo comando se combinan con `OR`— más el trigger que estampa la autoría del borrado y el que deriva las columnas planas desde `answers` |
| `20260901_add_invitations_purge` | Tabla `invitations` con la fecha de boda, `purge_all_expired_rsvp()`, cron nocturno, clave foránea y retirada de `retained_until` |
| `20260902_add_rsvp_closure` | `rsvp_deadline_utc`, `rsvp_override`, `is_rsvp_open`, `get_rsvp_status` y el cierre real dentro del `WITH CHECK` de la inserción anónima |
| `20260903_add_purge_warning` | Aviso por correo antes del borrado irreversible, vía Edge Function y `pg_net` |
| `20260904_prevent_duplicate_rsvp` | Identidad normalizada y trigger que convierte un reenvío en corrección de la fila existente |
| `20260905_add_admin_audit.sql` | `admin_audit`, triggers de auditoría sobre respuestas e invitación, y RLS de solo lectura. La clave foránea en cascada hace que la purga se lleve el rastro. |

Dos reglas que estas migraciones fijan, aprendidas al ejecutarlas:

1. **Revocar de `PUBLIC` no basta.** Los privilegios por defecto de Supabase conceden `EXECUTE` sobre cada función
   nueva de `public` directamente a `anon` y `authenticated`. Toda función `SECURITY DEFINER` revoca **nombrando los
   roles**.
2. **El orden de los triggers `BEFORE` es alfabético por nombre.** Por eso llevan prefijo numérico
   (`rsvp_responses_10_…`, `…_20_…`): el que corrige un duplicado necesita que `full_name` ya se haya derivado.

## Verificación local

```bash
pnpm run db:verify
```

Levanta un contenedor con la misma imagen de Postgres que usa Supabase, aplica todas las migraciones en orden, ejecuta
las suites pgTAP de `supabase/tests/database/` **por rol** y regenera `schema.sql`. Corre también en CI antes de
`db push`, así que una migración rota falla ahí y nunca llega a un proyecto real.

## Production pipeline

On a push to `main`, `.github/workflows/deploy.yml` runs in this order:

1. install frozen dependencies;
2. lint;
3. build the frontend;
4. link Supabase CLI to the configured project;
5. apply pending migrations with `supabase db push`;
6. publish the previously built output to Cloudflare Pages with `wrangler`.

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
| `SUPABASE_SERVICE_ROLE_KEY` | Used only by the wedding-date sync step; the policy grants `SELECT` on `invitations` to `authenticated`, so the anon key cannot write it |

Variable de repositorio (no secreto): `NARTEA_WEDDING_REGISTERED`. Vale `false` hasta el primer despliegue correcto,
para que un slug ya ocupado por otra boda falle en rojo en vez de sobrescribir su fecha en silencio.

Only the two frontend values are mapped to `VITE_*`. Never expose the access token or database password through Vite.

## Creating a change

Create one immutable timestamped file per schema change:

```text
supabase/migrations/<timestamp>_<description>.sql
```

Prefer additive, backwards-compatible migrations. Review and commit the file with the application change. Do not edit a
migration after production has applied it; create a new one. La única excepción registrada es el bootstrap idempotente
de `20260712`, necesario para que el historial inicial pueda ejecutarse sobre una base vacía sin reparar producción.

## Existing remote project

This repository adopted migrations after the initial table already existed. The first tracked migration now bootstraps
that table with `CREATE TABLE IF NOT EXISTS` and then uses `ADD COLUMN IF NOT EXISTS`. Do not apply it manually or
repair the history: the existing project already records `20260712`, while new projects execute it normally.

## Verificación de Sprint 7.1

La estrategia se probó en Supabase local de dos formas:

1. instalación limpia ejecutando `20260712` y `20260802` desde una base vacía;
2. actualización desde `20260712` con un registro ficticio y las políticas legacy activas.

La actualización conservó el registro. El asesor de seguridad local terminó sin avisos y la matriz funcional confirmó:

- `anon` puede insertar un payload válido;
- `anon` no puede leer ni enviar un payload incompleto;
- una pareja solo ve la invitación asignada;
- un usuario autenticado sin membresía no ve respuestas;
- `service_role` conserva los permisos operativos explícitos.

## Troubleshooting

- `PGRST204` for a new column means the frontend was deployed before its migration.
- `supabase migration list` compares local and remote history.
- `supabase db push --dry-run` previews pending migrations.
- `migration repair` changes history only; use it only after confirming the real schema.
- Once this workflow is active, do not make production schema changes through Table Editor or SQL Editor.

## Trabajo obligatorio antes de 1.0.0

El despliegue y la recuperación se rigen por el
[runbook de migración de seguridad RSVP](./RSVP_SECURITY_MIGRATION_RUNBOOK.md).

1. Aplicar la migración de seguridad solo después de revisar la PR y confirmar un backup operativo.
2. Verificar en remoto policies, grants y migración aplicada sin consultar filas RSVP.
3. Completar autenticación OTP y provisionamiento antes de considerar Admin utilizable.
4. Confirmar el responsable operativo antes del despliegue.

# Despliegue de la purga y del aviso previo

Los pasos de esta guía tocan servicios externos (Supabase, Vault, Resend, GitHub Actions).
**Ninguno se ha ejecutado**: esta implementación es local y el repositorio real todavía no
existe. Quedan escritos tal cual para cuando exista.

Estado de cada paso: `OMITIDO` = escrito, no ejecutado.

## Qué se ha implementado en el repositorio

| Archivo | Qué hace |
|---|---|
| `supabase/migrations/20260831_fix_rsvp_update_policies.sql` | Una sola policy de `UPDATE` + trigger de autoría (§1.2) y trigger de sincronía `answers` ↔ columnas planas (§1.3) |
| `supabase/migrations/20260901_add_invitations_purge.sql` | Tabla `invitations`, `purge_all_expired_rsvp()`, cron nocturno, FK, retirada de `retained_until` (§8.1) |
| `supabase/migrations/20260902_add_rsvp_closure.sql` | `rsvp_deadline_utc`, `rsvp_override`, `is_rsvp_open`, `get_rsvp_status`, cierre real en el `WITH CHECK` (§12.1) |
| `supabase/migrations/20260903_add_purge_warning.sql` | `purge_warning_sent_at`, `get_pending_purge_warnings`, cron del aviso (§8.4) |
| `supabase/functions/send-purge-warnings/index.ts` | Edge Function que envía el aviso por Resend (§8.4) |
| `scripts/sync-invitation.ts` | Publica `event_date_utc`; falla en rojo si el slug ya está registrado (§8.5, §12.4) |
| `supabase/migrations/20260904_prevent_duplicate_rsvp.sql` | Índice de identidad normalizada + trigger que convierte un reenvío en corrección (§10.2) |
| `supabase/local/` | Banco de pruebas local de las migraciones (`pnpm run db:verify`) |
| `.github/workflows/deploy.yml` | Verificación de migraciones, sync de fecha y deploy de la función (§8.5) |

## Verificación local — sí ejecutada

`pnpm run db:verify` levanta un Postgres desechable en Docker (`supabase/local/`), aplica las
nueve migraciones en orden y comprueba el esquema resultante **y el comportamiento** de triggers
y funciones. No es un clon de Supabase: `auth`, `cron`, `net` y `vault` son stubs, suficientes
para que las migraciones apliquen y las policies se puedan inspeccionar.

Al terminar regenera `supabase/schema.sql` desde las migraciones aplicadas, y el workflow falla
si ese archivo queda desincronizado.

Ya ha encontrado un fallo real: los dos triggers `BEFORE INSERT` se disparan en orden alfabético,
y `redirect_duplicate` corría antes de que `full_name` se derivara de `answers`, así que la
corrección de una respuesta acababa rechazada por el índice único. De ahí los prefijos `10_`/`20_`
en los nombres de los triggers.

## Pasos de infraestructura — OMITIDOS

### 1. Extensiones — ahora las crea una migración

`20260711_enable_extensions.sql` ejecuta `CREATE EXTENSION IF NOT EXISTS` sobre **pg_cron** y **pg_net** antes que
ninguna otra migración, así que este paso ya no es manual: una base vacía
—`supabase start`, `supabase db reset`, un proyecto nuevo— se prepara sola.

**Queda una comprobación en la fase 9.1:** que el rol con el que el workflow aplica migraciones
tenga permiso para crear esas dos extensiones en el proyecto real. Si no lo tiene, la migración
falla en rojo y el camino sigue siendo el de antes — Dashboard → Database → Extensions, activar **pg_cron** y **pg_net**
antes del primer push.

### 2. Secretos en Vault — OMITIDO

Nunca en texto plano en la migración ni en el repositorio. En el SQL editor de Supabase, con
los valores reales del proyecto (Settings → API):

```sql
SELECT vault.create_secret('<service-role-key>', 'service_role_key');
SELECT vault.create_secret('https://<project-ref>.functions.supabase.co', 'functions_base_url');
```

La migración `20260903` los lee desde `vault.decrypted_secrets`. Sin estos dos secretos el cron
del aviso se programa pero cada ejecución falla.

### 3. Aplicar migraciones — OMITIDO

Las aplica el propio workflow (`supabase db push --linked`) en cada push a `main`. Los pasos 1
y 2 deben estar hechos **antes** del primer push que incluya estas migraciones.

### 4. Secret de Resend para la Edge Function — OMITIDO

```bash
supabase secrets set RESEND_API_KEY=<clave> PURGE_WARNING_SENDER=avisos@<tudominio>
```

`SUPABASE_URL`, `SUPABASE_ANON_KEY` y `SUPABASE_SERVICE_ROLE_KEY` los inyecta la plataforma.

### 5. Dominio verificado en Resend — OMITIDO

En el dashboard de Resend: verificar el dominio remitente añadiendo los registros DNS TXT/CNAME
que indique. Sin dominio verificado, Resend rechaza el envío con 403 y ninguna boda se marca
como avisada — el aviso se reintenta cada noche.

### 6. Secrets y variables de GitHub Actions — OMITIDO

| Nombre | Tipo | Por qué |
|---|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | Secret | El paso de sync escribe en `invitations`; la policy solo concede `SELECT` a `authenticated` |
| `NARTEA_WEDDING_REGISTERED` | Variable | `false` (o ausente) en el primer despliegue: el `INSERT` falla en rojo si el slug ya pertenece a otra boda. Se pone a `true` tras el primer despliegue correcto |

`SUPABASE_URL` no hace falta como secret: el workflow la deriva de `SUPABASE_PROJECT_ID`.

### 7. Validar la clave foránea — OMITIDO

Tras el primer sync correcto, y una vez comprobado que no quedan respuestas huérfanas:

```sql
ALTER TABLE public.rsvp_responses VALIDATE CONSTRAINT rsvp_responses_wedding_slug_fkey;
```

## Comprobaciones tras el primer despliegue real

1. `SELECT * FROM cron.job;` devuelve `purge-expired-rsvp-daily` y `send-purge-warnings-daily`.
2. `SELECT * FROM public.invitations;` tiene una fila con la fecha de la boda y un
   `rsvp_deadline_utc` a 14 días vista de ella.
3. `SELECT public.is_rsvp_open('<slug>');` devuelve `true`.
4. Un `INSERT` anónimo con la anon key tras poner `rsvp_override = 'closed'` debe fallar con
   `42501`, y la invitación debe enseñar la página de cierre, no un error genérico.

## Lo que sigue necesitando redespliegue

El panel cambia al instante la fecha límite y el interruptor manual. Todo lo demás —contenido
de la boda, apagar la capacidad de RSVP entera, congelar la invitación, tema, idiomas,
secciones activas— sigue necesitando build y despliegue.

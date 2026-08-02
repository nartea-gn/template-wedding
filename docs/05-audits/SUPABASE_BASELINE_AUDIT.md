# Auditoría de baseline de Supabase

## Estado

- **Fecha:** 2026-08-02
- **Fase:** Sprint 7.1
- **Resultado:** inventario local y comparación remota de solo lectura completados
- **Restricción:** no se ha mutado el proyecto Supabase

## Evidencia local

`supabase/schema.sql` define `rsvp_responses` con catorce columnas, RLS habilitado y dos políticas para `anon`:

- `INSERT WITH CHECK (true)`;
- `SELECT USING (true)` global.

La única migración versionada, `20260712_add_dynamic_rsvp_answers.sql`, añade cuatro columnas y un índice a una tabla
que da por existente. Por tanto, un proyecto Supabase vacío no puede reconstruirse únicamente con las migraciones.

| Elemento | `schema.sql` | Migraciones | Estado |
|---|---:|---:|---|
| Creación de `rsvp_responses` | Sí | No | No reproducible desde cero |
| Columnas legacy | Sí | No | Sin baseline versionada |
| Columnas dinámicas | Sí | Sí | Aditivas |
| Índice `(wedding_slug, form_id)` | No | Sí | Solo migración |
| RLS habilitado | Sí | No | No reproducible desde cero |
| Políticas actuales | Sí | No | No versionadas |
| Membresía administrativa | No | No | Pendiente de diseño/implementación |

## Evidencia del despliegue

El workflow de `main` enlaza el proyecto y ejecuta `supabase db push`. La última ejecución inspeccionada terminó
correctamente e indicó que la base remota estaba actualizada respecto de las migraciones locales.

Esto **no demuestra** equivalencia completa entre remoto y `schema.sql`: solo indica que Supabase CLI no encontró
migraciones locales pendientes en ese historial.

## Evidencia remota verificada

La inspección por Management API confirmó:

- PostgreSQL 17.6 y proyecto activo;
- una única migración remota: `20260712_add_dynamic_rsvp_answers`;
- las catorce columnas coinciden con la combinación de `schema.sql` y la migración aditiva;
- solo existe la restricción de clave primaria; no hay límites de longitud, forma o valores;
- existen el índice primario y `rsvp_responses_form_id_idx`;
- RLS está habilitado pero no forzado;
- `anon INSERT WITH CHECK (true)` y `anon SELECT USING (true)` están activos;
- `invitation_admins` todavía no existe;
- Supabase Auth no contiene usuarios;
- no hay triggers de fila sobre `rsvp_responses`.

Los grants de tabla para `anon` y `authenticated` incluyen todas las operaciones estándar. RLS impide operaciones sin
política, pero Sprint 7.1 deberá reducir también los grants al mínimo explícito para evitar depender de permisos
implícitos innecesarios.

El asesor oficial de Supabase informó además:

- `rls_policy_always_true` sobre la inserción anónima;
- `public.rls_auto_enable()` como función `SECURITY DEFINER` ejecutable por `anon` y `authenticated`.

La función pertenece a un event trigger activo llamado `ensure_rls`, que habilita RLS automáticamente al crear tablas
en `public`. Su implementación fija `search_path=pg_catalog` y no pertenece a una extensión. No debe eliminarse sin
comprender su procedencia, pero sus permisos `EXECUTE` públicos deben revisarse y revocarse si no son necesarios.

No se consultaron filas de `rsvp_responses`, emails, mensajes ni otros datos personales. Tampoco se imprimieron tokens,
contraseñas o claves API.

## Riesgos

1. Crear una baseline suponiendo que `schema.sql` es idéntico al remoto puede romper despliegues existentes.
2. Versionar una nueva política sin retirar la lectura anónima deja el problema abierto.
3. Reparar manualmente el historial antes de compararlo puede ocultar divergencias.
4. Incluir datos o identificadores del proyecto en la evidencia puede crear una fuga innecesaria.

## Estrategia aprobada

1. Conservar esta evidencia remota sin registrar referencias o secretos en Git.
2. Definir una baseline para instalaciones vacías.
3. Definir una migración incremental para la instalación existente.
4. Incluir reducción de grants, políticas por rol y revisión de `rls_auto_enable`.
5. Ensayar ambos caminos en un proyecto aislado.
6. Documentar backup, rollback y reparación del historial.
7. Solo entonces aplicar cambios al proyecto real.

## Acciones prohibidas durante la auditoría

- `supabase db push` manual contra producción;
- `supabase db reset`;
- `supabase migration repair`;
- cambios desde Dashboard;
- SQL remoto de escritura;
- exportación de filas RSVP;
- exposición de secretos, URL o referencia del proyecto en commits.

## Validación local de la estrategia

- instalación vacía reconstruida con `20260712` y `20260802`;
- actualización desde el estado `20260712` ensayada con un registro ficticio preservado;
- policies legacy retiradas incluso si su nombre presenta diferencias de codificación;
- asesor de seguridad local sin avisos;
- inserción anónima válida `201`;
- lectura anónima e inserción incompleta rechazadas;
- aislamiento A/B y usuario sin membresía comprobados mediante transacción con rollback;
- permisos operativos de `service_role` declarados explícitamente.

## Criterio de salida

El inventario remoto y los dos caminos locales están completos. `G7-DATA` permanece abierto hasta revisar la PR,
documentar backup/rollback y verificar los metadatos remotos después de aplicar la migración aprobada.

## Fuente

- [Supabase: Database migrations](https://supabase.com/docs/guides/deployment/database-migrations)

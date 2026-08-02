# Auditoría de baseline de Supabase

## Estado

- **Fecha:** 2026-08-02
- **Fase:** Sprint 7.1
- **Resultado:** inventario local completo; comparación directa remota pendiente
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

## Estado remoto que falta comprobar

Antes de escribir la baseline definitiva se necesita una inspección de solo lectura de:

- historial de migraciones remoto;
- tablas, columnas, defaults, constraints e índices;
- RLS habilitado o forzado;
- políticas, roles y grants;
- funciones, triggers y extensiones relacionadas;
- volumen aproximado y existencia de instalaciones previas, sin exportar datos personales.

La máquina local no dispone actualmente de Supabase CLI enlazada ni de una sesión local segura. Los secretos existen
como secretos nominales del entorno GitHub Pages y no deben imprimirse ni copiarse a documentación.

## Riesgos

1. Crear una baseline suponiendo que `schema.sql` es idéntico al remoto puede romper despliegues existentes.
2. Versionar una nueva política sin retirar la lectura anónima deja el problema abierto.
3. Reparar manualmente el historial antes de compararlo puede ocultar divergencias.
4. Incluir datos o identificadores del proyecto en la evidencia puede crear una fuga innecesaria.

## Estrategia aprobada

1. Obtener acceso local temporal y seguro al proyecto, sin registrar secretos.
2. Ejecutar inventario remoto de solo lectura.
3. Comparar remoto, `schema.sql` y migraciones.
4. Definir una baseline para instalaciones vacías.
5. Definir una migración incremental para instalaciones existentes.
6. Ensayar ambos caminos en un proyecto aislado.
7. Documentar backup, rollback y reparación del historial.
8. Solo entonces aplicar cambios al proyecto real.

## Acciones prohibidas durante la auditoría

- `supabase db push` manual contra producción;
- `supabase db reset`;
- `supabase migration repair`;
- cambios desde Dashboard;
- SQL remoto de escritura;
- exportación de filas RSVP;
- exposición de secretos, URL o referencia del proyecto en commits.

## Criterio de salida

`G7-DATA` permanece abierto hasta que el estado remoto esté inventariado y los caminos de instalación vacía,
actualización, backup y rollback hayan sido ensayados fuera de producción.

## Fuente

- [Supabase: Database migrations](https://supabase.com/docs/guides/deployment/database-migrations)

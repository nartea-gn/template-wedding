# ADR-003: Infrastructure boundaries

- Estado: arquitectura aceptada; implementación pendiente
- Fecha: 2026-07-11

## Contexto

`useRsvp.ts` y `useAdminData.ts` mezclan estado de UI, mapeo y acceso directo a Supabase.

## Decisión

Las features usarán servicios dependientes de contratos de repositorio. Adaptadores en `infrastructure` implementarán
esos contratos para Supabase.

## Consecuencias

Centraliza mapeos y permite cambiar proveedor a cambio de más estructura. No modifica todavía comportamiento ni esquema.
La contraseña cliente y las RLS actuales continúan en v1; no constituyen autenticación robusta.


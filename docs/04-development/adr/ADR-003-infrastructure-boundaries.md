# ADR-003: Infrastructure boundaries

- Estado: aceptado e implementado
- Fecha: 2026-07-11

## Contexto

La implementación original mezclaba estado de UI, mapeo y acceso directo a Supabase en hooks de página.

## Decisión

Las features usarán servicios dependientes de contratos de repositorio. Adaptadores en `infrastructure` implementarán
esos contratos para Supabase.

## Consecuencias

El contrato `RsvpRepository` separa las Features de Supabase. El adaptador vive en `src/infrastructure/supabase` y el
mapeo DB ↔ dominio se centraliza en `mappers/rsvpMapper.ts`. RSVP y Admin consumen la composición de aplicación, no el
cliente del proveedor.

La separación añade estructura, pero permite probar contratos y sustituir infraestructura sin reescribir la UI. La
contraseña cliente y las RLS actuales continúan siendo una limitación de seguridad y se resolverán mediante una decisión
independiente en Sprint 7.1.

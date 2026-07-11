# ADR-005: Modern frontend baseline

- Estado: aceptado como objetivo; implementación pendiente
- Fecha: 2026-07-11

## Contexto

El proyecto usa React 18, React Router 6 y TypeScript 5. Se desea trabajar con React 19, Router 7 y TypeScript 7 cuando el ecosistema sea compatible.

## Decisión

- Objetivo React: 19.2 estable.
- Objetivo Router: React Router 7 en modo declarativo, manteniendo `HashRouter`.
- Objetivo TypeScript: 7, condicionado a compatibilidad con Vite, `typescript-eslint`, tipos de React y editor.
- Actualizar cada bloque por separado, regenerar lockfile y validar antes de continuar.

## Motivos

La aplicación no necesita adoptar el modo framework de React Router para obtener soporte moderno. Mantener el modo declarativo reduce el cambio y conserva GitHub Pages. TypeScript 7 ofrece un compilador nativo más rápido, pero su API programática todavía requiere cautela en herramientas que la integran.

## Consecuencias

- Se crea un hito técnico antes de `InvitationDefinition`.
- No se combinan upgrades con refactors funcionales.
- Si TypeScript 7 rompe una herramienta crítica, se mantiene temporalmente la versión compatible más reciente sin bloquear React o Router.

## Validación

Lint, build, servidor de desarrollo, navegación hash, Landing, RSVP, Admin y tipos del editor.


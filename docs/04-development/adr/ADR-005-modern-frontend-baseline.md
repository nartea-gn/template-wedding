# ADR-005: Modern frontend baseline

- Estado: aceptado e implementado
- Fecha: 2026-07-11

## Contexto

En el momento de la decisión, el proyecto usaba React 18, React Router 6 y TypeScript 5. Se aprobó migrar a React 19,
Router 7 y TypeScript 7 después de comprobar la compatibilidad del ecosistema.

## Decisión

- React: 19.2.7.
- React Router: 7.18.1 en modo declarativo, manteniendo `HashRouter`. **`BrowserRouter` desde
  [`ADR-022`](./ADR-022-real-paths-routing.md)** (5 de septiembre de 2026); la versión y el modo
  declarativo no cambian.
- TypeScript: compilador 7.0.2 para `tsc`, con `@typescript/typescript6` side-by-side para la API que consume
  `typescript-eslint`.
- Actualizar cada bloque por separado, regenerar lockfile y validar antes de continuar.

## Motivos

La aplicación no necesita adoptar el modo framework de React Router para obtener soporte moderno. Mantener el modo
declarativo reduce el cambio y conserva GitHub Pages. TypeScript 7 ofrece un compilador nativo más rápido, pero su API
programática todavía requiere cautela en herramientas que la integran.

## Consecuencias

- El hito técnico se completó antes de `InvitationDefinition`.
- No se combinan upgrades con refactors funcionales.
- La dependencia `typescript` expone la API compatible de TypeScript 6 y `@typescript/native` aporta el binario `tsc` 7,
  siguiendo la estrategia oficial de transición.

## Validación

Lint, build, servidor de desarrollo, navegación hash, Landing, RSVP, Admin y tipos del editor.

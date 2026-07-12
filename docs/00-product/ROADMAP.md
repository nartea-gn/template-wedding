# Roadmap

1. **Sprint 0 — Foundation (completado):** visión, auditorías, arquitectura, especificación y ADRs.
2. **Sprint 1 — Design foundations (implementado y validado):** tokens TypeScript y consolidación visual sin cambiar
   comportamiento.
3. **Hito 1.1 — Modern frontend baseline (completado):** React 19.2.7, React Router 7.18.1 y TypeScript 7.0.2;
   compatibilidad de ESLint mediante TypeScript 6 side-by-side.
4. **Sprint 2 — Invitation contract (implementado y validado):** contratos Core, catálogos tipados y primera definición
   declarativa.
5. **Sprint 2.1 — Localization foundation (implementado y validado):** runtime Core con español por defecto, inglés y
   búlgaro diferidos, `Intl`, persistencia y selector opcional.
6. **Sprint 3 — Section engine (implementado y validado):** registro tipado, renderer React en `app`, cinco secciones
   compartidas, assets inyectados y eliminación del adaptador legacy.
7. **Sprint 4 — Configurable RSVP (implementado; validación final pendiente):** Form Engine, contrato Repository,
   adaptador Supabase, persistencia versionada y compatibilidad legacy.
8. **Sprint 4.1 — Database migrations pipeline (implementado; activación en GitHub pendiente):** migraciones Supabase
   versionadas y despliegue automático antes de GitHub Pages.
9. **Sprint 5 — Optional Admin (base implementada; validación final pendiente):** ruta condicional, métricas y
   respuestas derivadas de la definición del formulario, conservando la contraseña v1.
10. **Sprint 6 — Premium experience:** UI, responsive, accesibilidad, motion responsable y rendimiento.

Cada sprint termina con `pnpm lint`, `pnpm build` y revisión manual proporcional. Auth robusta, staging, SaaS, editor,
plugins, monorepo, SDK y CLI quedan diferidos hasta que exista una necesidad real.

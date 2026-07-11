# Roadmap

1. **Sprint 0 — Foundation (completado):** visión, auditorías, arquitectura, especificación y ADRs.
2. **Sprint 1 — Design foundations (implementado; revisión visual pendiente):** tokens TypeScript y consolidación visual
   sin cambiar comportamiento.
3. **Hito 1.1 — Modern frontend baseline (completado):** React 19.2.7, React Router 7.18.1 y TypeScript 7.0.2;
   compatibilidad de ESLint mediante TypeScript 6 side-by-side.
4. **Sprint 2 — Invitation contract (implementado; validación manual pendiente):** contratos Core, catálogo español,
   primera definición y adaptador temporal desde la configuración actual.
5. **Sprint 2.1 — Localization foundation:** catálogos tipados, carga por locale, fallbacks, `Intl` y selector opcional.
   El modo monolingüe no carga idiomas secundarios.
6. **Sprint 3 — Section engine:** registro tipado, renderer y migración incremental. Reordenar, traducir o desactivar no
   exigirá editar el renderer.
7. **Sprint 4 — RSVP:** Form Engine mínimo, repositorio y adaptador Supabase con preguntas y validaciones localizables.
8. **Sprint 5 — Optional Admin:** ruta condicional y respuestas dinámicas, conservando la contraseña v1; interfaz
   localizable según el alcance de la invitación.
9. **Sprint 6 — Premium experience:** UI, responsive, accesibilidad, motion responsable y rendimiento.

Cada sprint termina con `pnpm lint`, `pnpm build` y revisión manual proporcional. TypeScript 7 solo se adopta si Vite,
ESLint, editor y tipos permanecen compatibles. Auth robusta, SaaS, editor, plugins, monorepo, SDK y CLI quedan
diferidos.

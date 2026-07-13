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
9. **Sprint 5 — Optional Admin (implementado; validación automática y manual pendientes):** ruta condicional, métricas,
   respuestas dinámicas, recuperación ante error, responsive y accesibilidad, conservando la contraseña v1.
10. **Sprint 5.1A — Read-only Admin operations (planificado):** capacidades configurables para exportar la vista a CSV,
    buscar y ordenar respuestas, mostrar el número de resultados y la fecha de la última actualización correcta.
11. **Sprint 5.1B — Protected Admin operations (bloqueado por seguridad):** abrir o cerrar confirmaciones desde el
    panel,
    persistir el estado por invitación y aplicarlo al CTA y a la ruta pública. Requiere autenticación o validación en
    servidor, autorización y políticas restrictivas antes de implementar escrituras.
12. **Sprint 6 — Premium experience:** UI, responsive, accesibilidad, motion responsable, optimización de medios
    pesados,
    rendimiento medido y revisión Lighthouse, sin añadir nuevas capacidades de negocio.
13. **Sprint 7 — Release hardening:** estabilización de flujos críticos, pruebas proporcionadas, accesibilidad,
    compatibilidad, seguridad/RLS, privacidad, operación, documentación de despliegue y preparación de `1.0.0`.

Cada sprint termina con `pnpm lint`, `pnpm build` y revisión manual proporcional. El detalle y las dependencias de los
evolutivos se mantienen en [`PRODUCT_BACKLOG.md`](./PRODUCT_BACKLOG.md); una entrada en ese backlog no equivale a un
compromiso de implementación.

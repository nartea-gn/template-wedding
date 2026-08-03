# Changelog

Este archivo registra hitos consolidados. El detalle de trabajo futuro pertenece al roadmap y al backlog.

## Unreleased

### Seguridad de RSVP y acceso Admin — Sprint 7.1

- Lectura RSVP aislada mediante RLS por usuario e invitación; `anon` conserva exclusivamente la inserción pública
  necesaria.
- Baseline reproducible y migración incremental verificadas en instalaciones locales limpias y existentes.
- Acceso Admin sustituido por email OTP de seis dígitos, sesión Supabase y cierre de sesión real.
- Provisionamiento y revocación manual documentados, sin secretos privilegiados ni contraseñas dentro del bundle.
- Flujo Admin validado en escritorio y móvil, incluida restauración, logout y respuesta neutra para correos
  desconocidos.

### Theme Engine v2 y baseline visual — Sprints 6.4–6.6

- Theme Engine v2 con contratos de composición, motion, superficies, decoración e iconografía para cinco temas.
- Preservación explícita de la identidad tipográfica histórica de Royal.
- Alineación de anillos y unidades del countdown en resoluciones estrechas.
- Roles cromáticos semánticos y contraste estático AA para Royal, Boho, Dark, Magnolia y Linen.
- Fondos artísticos modulares y responsive en Landing, RSVP y éxito, sin estiramientos ni costuras visibles.
- Royal restaurado y aprobado como baseline; comparativa de las cinco colecciones completada en móvil y escritorio.
- Superficies funcionales de RSVP protegidas y Admin conservado como experiencia operativa.
- Documentación de producto, configuración, arquitectura, auditorías y release alineada con el runtime actual.
- `pnpm lint` y `pnpm build` confirmados por producto sobre el trabajo integrado en PR #17.

### Limitaciones conocidas antes de 1.0.0

- No hay suite de pruebas ni validación automática en pull requests.
- `seo` y `deadline` forman parte del contrato, pero todavía no tienen consumidores completos.

## Hitos consolidados

### Experiencia premium y responsive — Sprints 6.0–6.3

- Una única superficie visual para RSVP y mejoras de accesibilidad del Form Engine.
- Selector de idioma compacto y estable en todos los breakpoints.
- Iconografía SVG propia, alianzas del countdown y motion compatible con `prefers-reduced-motion`.
- Vídeo bajo demanda con poster WebP y procedimiento reproducible de optimización.
- Selector adaptativo de proveedores de mapas compatible con Android, iOS y escritorio.
- Refinamiento responsive de Landing, RSVP y Admin.

### Admin opcional — Sprints 5.0–5.1A

- Ruta y bundle condicionales.
- Métricas configurables, tabla dinámica y compatibilidad con respuestas legacy.
- Búsqueda, filtros, ordenación, paginación y selector de filas.
- Exportación CSV del conjunto presentado y fecha de última actualización.

### Form Engine y persistencia — Sprints 4.0–4.1

- Formulario RSVP declarativo, versionado y localizado.
- Repository Pattern y adaptador Supabase desacoplado de React.
- Respuestas dinámicas almacenadas como JSONB con mapper centralizado.
- Pipeline de migraciones previo al despliegue de GitHub Pages.

### Motor configurable — Sprints 2.0–3.0

- `InvitationDefinition` como contrato principal.
- Localización Core con español, inglés y búlgaro, carga diferida y selector opcional.
- Section Registry tipado y orden de secciones gobernado por configuración.
- Rutas y capabilities opcionales.

### Fundamentos — Sprints 0–1

- Visión de producto, principios, ADR y arquitectura incremental.
- Design Tokens TypeScript y temas centralizados.
- React 19, React Router 7, TypeScript 7, Vite 8 y Tailwind CSS 4.

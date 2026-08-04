# Changelog

Este archivo registra hitos consolidados. El detalle de trabajo futuro pertenece al roadmap y al backlog.

## Unreleased

### QA de release — Sprint 7.4

- El selector móvil de mapas respeta el viewport dinámico y las áreas seguras del dispositivo.
- Las opciones automática, Google Maps y Apple Maps permanecen completamente visibles en 320 × 568, 360 × 740 y
  390 × 844 px, sin alterar el popover de escritorio.
- Playwright cubre el encaje vertical de las tres opciones en un viewport móvil compacto.
- La concurrencia local de Playwright queda limitada a dos workers para que el comando oficial sea estable y
  reproducible en el entorno de desarrollo.
- Una matriz manual estable ejecuta 44 recorridos sobre Chromium, Firefox, WebKit, Pixel 5 e iPhone 13 emulados; los
  smoke tests responsive cubren 320, 390, 768 y 1440 px.
- El selector de idioma completa el patrón de menú con foco inicial, flechas, Inicio/Fin, Escape y retorno al trigger;
  el selector de mapas queda cubierto por el mismo contrato de foco y cierre.

### Contratos runtime completos — Sprint 7.3

- `event.date` unifica hero y countdown mediante un instante ISO 8601 con offset explícito.
- `rsvp.deadline` gobierna CTA, ruta y comprobación previa al envío sin ocultar Admin.
- CTA y rutas reflejan el cierre al alcanzar el deadline aunque la página permanezca abierta.
- SEO localizado actualiza título, metadescripción e idioma activo.
- Validación estructural cubre fechas, timezone, orden temporal, IDs, estados vacíos y límites de formulario.
- Los E2E fijan el reloj para permanecer reproducibles después de la fecha de la invitación de referencia.

### Quality gates automatizados — Sprint 7.2

- Vitest y React Testing Library cubren configuración, localización, Form Engine, mappers, Repository, rutas opcionales
  y estados de Admin.
- Playwright valida Landing, RSVP afirmativo y negativo, error recuperable y acceso protegido de Admin en Chromium.
- pgTAP verifica estructura, privilegios, RLS y aislamiento entre invitaciones sobre Supabase local.
- El workflow de Pull Request separa gates de aplicación y base de datos, fija las versiones de herramientas y conserva
  el informe Playwright como artefacto de diagnóstico.

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

- La matriz exhaustiva de Firefox, WebKit, móvil y dispositivos físicos pertenece a Sprint 7.4.

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

# Roadmap

## Estado

El producto continúa en fase previa a `1.0.0`. La arquitectura configurable está consolidada; el trabajo inmediato es
cerrar Theme Engine v2 y convertir seguridad, datos, calidad y QA en puertas verificables de release.

Leyenda: `Completado`, `En validación`, `En curso`, `Planificado`, `Aplazado`.

## Ahora

### Sprint 6.6 — Coherencia y dirección visual · En curso

**Objetivo:** preservar Royal, corregir regresiones objetivas y evolucionar las colecciones desde variaciones de tokens
hacia experiencias visuales reconocibles.

**Incrementos:**

1. `6.6.1` — Royal activo, contraste semántico, countdown y primer render.
2. `6.6.2` — Escala tipográfica, controles, touch targets y selector de idioma.
3. `6.6.3` — Landing editorial y backgrounds temáticos responsive.
4. `6.6.4` — RSVP: ritmo, errores y superficies de lectura.
5. `6.6.5` — Admin: jerarquía operativa, KPIs, toolbar y tabla.
6. `6.6.6` — Comparativa final de colecciones y adopción de la investigación tipográfica aprobada en Nartea Studio.

**Criterio de salida:** auditoría aprobada, capturas comparables de los cinco temas, Royal sin regresiones, contraste AA,
backgrounds validados en los viewports objetivo y pruebas manuales de Landing, RSVP y Admin.

**Estado de 6.6.1:** implementado y validado en navegador; pendiente de `pnpm lint`, `pnpm build` y aprobación manual de
producto antes de cerrarlo.

### Sprint 6.4 — Theme Engine v2 · Completado

**Objetivo:** ampliar la identidad visual de los cinco temas sin introducir lógica de producto en el motor visual.

**Implementado:** contrato tipado, emisión de Custom Properties, consumidores compartidos, perfiles diferenciados y
preservación de Royal.

**Criterio de salida:** `pnpm lint`, `pnpm build` y validación manual de Royal, Boho, Dark, Magnolia y Linen en Landing,
RSVP y Admin para móvil, tablet y escritorio.

### Sprint 6.5 — Alineación documental y preparación de release · Completado

**Objetivo:** hacer que README, roadmap, backlog, ADR, auditorías y guías describan el producto real y sus riesgos.

**Criterio de salida:** documentación navegable, estados sin contradicciones, guía de configuración reproducible,
checklist de release y siguientes sprints definidos con criterios de aceptación.

## Antes de 1.0.0

### Sprint 7.1 — Seguridad, privacidad y baseline de datos · Planificado · P0

**Objetivo:** establecer autoridad real sobre respuestas RSVP y un esquema reproducible.

**Dependencias:** decisión aprobada de autenticación/autorización y auditoría del historial remoto de Supabase.

**Criterio de salida:**

- lectura administrativa protegida y aislada por invitación;
- inserción pública limitada al alcance necesario;
- políticas RLS revisadas y verificadas;
- baseline aplicable a una instalación vacía sin romper proyectos existentes;
- política documentada de información, minimización, retención, exportación y borrado.

### Sprint 7.2 — Quality gates automatizados · Planificado · P1

**Objetivo:** detectar regresiones de contratos y flujos críticos antes del despliegue.

**Dependencias:** elección explícita del stack de pruebas; no existe framework configurado actualmente.

**Criterio de salida:** pruebas unitarias de validadores/mappers, integración del repositorio, E2E de Landing/RSVP/Admin
y workflow de pull request con lint, build y pruebas.

### Sprint 7.3 — Contratos completos · Planificado · P1

**Objetivo:** eliminar configuración declarada pero no aplicada.

**Criterio de salida:** `seo` y `deadline` implementados o retirados mediante decisión explícita; fecha de evento y
target del countdown tienen una fuente de verdad; estados vacíos y URLs configurables están validados.

### Sprint 7.4 — QA de release · Planificado · P1

**Objetivo:** validar la experiencia final con contenido y dispositivos representativos.

**Criterio de salida:** WCAG AA, teclado y zoom; 320/390/768/1440 px; Safari iOS, Chrome Android y escritorio;
invitaciones mono/multilenguaje, con/sin RSVP/Admin; estados de error; Lighthouse y Core Web Vitals documentados.

### Sprint 7.5 — Release candidate · Planificado · P1

**Objetivo:** publicar `1.0.0` solo cuando no existan bloqueos conocidos.

**Criterio de salida:** congelación funcional, checklist completo, versionado coherente, smoke test del despliegue,
rollback documentado y changelog final.

## Después de 1.0.0

### Evolución artística adicional por colecciones · Planificado · P2

- Ampliar la personalidad de cada colección después del baseline entregado en Sprint 6.6, sin alterar Royal.
- Consumir las decisiones tipográficas de Nartea Studio; `template-wedding` aporta prototipos y evidencia, no una
  investigación normativa paralela.
- Validar fotografía, composición, ritmo y ornamentación con referencias concretas aportadas por producto.
- Medir carga selectiva o self-hosting de fuentes antes de añadir complejidad.

### Evolución por uso real · Planificado · P2

- Consultas y paginación de servidor cuando volumen o latencia lo justifiquen.
- Operaciones protegidas de Admin, detalle móvil, XLSX, notificaciones y gestión avanzada solo con un caso real.
- Nuevos tipos de evento después de validar un segundo dominio real.

## Aplazado explícitamente

- Galería.
- Historia o timeline narrativo.
- Música.

El Section Registry y las capabilities permiten incorporarlos más adelante sin modificar la orquestación del Core, pero
no se retomarán hasta que exista una necesidad de cliente y un contrato de contenido aprobado.

## Historial consolidado

| Hito              | Estado     | Resultado                                                    |
|-------------------|------------|--------------------------------------------------------------|
| Sprint 0          | Completado | Visión, principios, arquitectura, auditorías y ADR iniciales |
| Sprint 1          | Completado | Design Tokens TypeScript y fundamentos visuales              |
| Hito 1.1          | Completado | React 19, Router 7, TypeScript 7, Vite 8 y Tailwind 4        |
| Sprint 2          | Completado | Invitation Definition y catálogos tipados                    |
| Sprint 2.1        | Completado | Localización Core ES/EN/BG con selector opcional             |
| Sprint 3          | Completado | Section Registry y renderer declarativo                      |
| Sprint 4          | Completado | Form Engine, Repository y persistencia dinámica RSVP         |
| Sprint 4.1        | Completado | Migraciones automáticas previas al deploy                    |
| Sprint 5          | Completado | Admin opcional y dinámico                                    |
| Sprint 5.1A       | Completado | Búsqueda, ordenación, paginación y CSV                       |
| Sprints 6.0–6.3.5 | Completado | UX, media, responsive, mapas y compatibilidad móvil          |

El inventario de evolutivos y sus condiciones se mantiene en
[`PRODUCT_BACKLOG.md`](./PRODUCT_BACKLOG.md). Una entrada en backlog no equivale a compromiso de implementación.

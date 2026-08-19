# Roadmap

## Estado

El producto continúa en fase previa a `1.0.0`. La arquitectura configurable, Theme Engine v2 y el baseline visual de las
cinco colecciones están consolidados. El siguiente tramo convierte seguridad, datos, calidad y QA en puertas
verificables de release.

Leyenda: `Completado`, `En validación`, `En curso`, `Planificado`, `Aplazado`.

## Último sprint completado

### Sprint 6.6 — Coherencia y dirección visual · Completado

**Objetivo:** preservar Royal, corregir regresiones objetivas y evolucionar las colecciones desde variaciones de tokens
hacia experiencias visuales reconocibles.

**Resultado por incremento:**

1. `6.6.1` — Royal restaurado y aprobado; contraste semántico, countdown y primer render corregidos.
2. `6.6.2` — Escala tipográfica, controles, touch targets, selector de idioma y roles cromáticos consolidados.
3. `6.6.3` — Landing editorial y sistema modular de backgrounds responsive integrado.
4. `6.6.4` — RSVP alineado con la identidad temática y con superficies funcionales legibles.
5. `6.6.5` — Admin mantiene jerarquía operativa, KPIs, toolbar y tabla sin arte ceremonial.
6. `6.6.6` — Comparativa móvil/escritorio de Royal, Boho, Dark, Magnolia y Linen completada; baseline tipográfico
   existente preservado hasta que Nartea Studio apruebe una sustitución y su estrategia de carga.

**Evidencia de salida:** auditoría actualizada, Royal aprobado por producto, cinco familias de fondos comparadas en
móvil y escritorio, contraste estático AA, ausencia de overflow en los viewports objetivo y `pnpm lint`/`pnpm build`
confirmados por producto sobre el trabajo integrado en PR #17.

El cierre corresponde al baseline visual, no al QA final de `1.0.0`. Admin autenticado con respuestas reales, teclado,
lector de pantalla, zoom al 200 %, dispositivos físicos y rendimiento permanecen en Sprint 7.4.

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

## Ahora — Sprint 7

El plan maestro, la secuencia y los gates se definen en [`SPRINT_7_PLAN.md`](./SPRINT_7_PLAN.md).

### Sprint 7.1 — Seguridad, privacidad y baseline de datos · Completado · P0

**Objetivo:** establecer autoridad real sobre respuestas RSVP y un esquema reproducible.

**Entrada:** modelo de amenazas, inventario de datos y acceso verificable al proyecto Supabase real.

**Dependencias:** decisión aprobada de autenticación/autorización, requisitos de privacidad y auditoría del historial
remoto de Supabase.

**Dirección aprobada:** OTP por email, sesión persistente, membresía de usuarios por invitación, lectura protegida por
RLS e inserción RSVP anónima limitada. La auditoría remota de solo lectura permanece como gate antes de crear o aplicar
migraciones.

**Resultado por incremento:**

1. `7.1A` — Seguridad y baseline de datos: retiro de `anon SELECT`, membresías y baseline aplicada.
2. `7.1B` — Identidad y sesión Admin: OTP por email, sesión Supabase y cierre de sesión.
3. `7.1C` — Provisionamiento y verificación: operación manual controlada y matriz local de roles y acceso.
4. `7.1D` — Ciclo de vida: retención, exportación JSON/CSV, corrección, soft delete y purga de registros expirados.

**Criterio de salida:**

- lectura administrativa protegida y aislada por invitación;
- inserción pública limitada al alcance necesario;
- políticas RLS revisadas y verificadas;
- baseline aplicable a una instalación vacía sin romper proyectos existentes;
- política documentada de información, minimización, retención, exportación y borrado.

### Sprint 7.2 — Quality gates automatizados · Completado · P1

**Objetivo:** detectar regresiones de contratos y flujos críticos antes del despliegue.

**Evidencia:** stack aceptado en `ADR-016`; gates de aplicación y base de datos superados en la Pull Request `#20`.

**Dirección:** Vitest y React Testing Library para contratos e integración, Playwright Chromium como gate rápido y pgTAP
sobre Supabase local para grants y RLS. La matriz completa de navegadores permanece en Sprint 7.4.

**Criterio de salida:** pruebas unitarias de validadores/mappers, integración del repositorio, E2E de Landing/RSVP/Admin
y workflow de pull request con lint, build y pruebas.

### Sprint 7.3 — Contratos completos · Completado · P1

**Objetivo:** eliminar configuración declarada pero no aplicada.

**Criterio de salida:** `seo` y `deadline` implementados o retirados mediante decisión explícita; fecha de evento y
target del countdown tienen una fuente de verdad; estados vacíos y URLs configurables están validados.

**Evidencia:** contratos aplicados en `sprint/7.3-contracts`; lint, 39 pruebas unitarias, build, 6 recorridos E2E y 15
aserciones pgTAP superados localmente; gates `Application quality` y `Database quality` superados en la Pull Request
`#21`.

### Sprint 7.4 — QA de release · En curso · P1

**Objetivo:** validar la experiencia final con contenido y dispositivos representativos.

**Criterio de salida:** WCAG AA, teclado y zoom; 320/390/768/1440 px; Safari iOS, Chrome Android y escritorio;
invitaciones mono/multilenguaje, con/sin RSVP/Admin; estados de error; Lighthouse y Core Web Vitals documentados.

**Primer incremento:** el selector adaptativo de mapas queda protegido frente a barras dinámicas y áreas seguras; las
tres opciones se verificaron en 320 × 568, 360 × 740, 390 × 844 y escritorio. La matriz completa continúa abierta.

**Segundo incremento:** 59 recorridos pasan en Chromium, Firefox, WebKit, Chrome móvil y Safari móvil emulados sobre
`00ed191`; Landing y RSVP no presentan overflow horizontal en 320/390/768/1440 px, los selectores gestionan foco,
teclado y Escape, y ES/EN/BG conservan idioma, SEO y countdown. Royal, Boho, Dark, Magnolia y Linen mantienen Landing,
RSVP y acceso Admin en móvil y escritorio.

**Tercer incremento — 7.4A:** `DC-018` queda resuelto conservando `primary` como acento artístico y aplicando roles de
texto con contraste AA. Contenido largo en ES, EN y BG, reflow al 200 % y la secuencia efectiva de teclado quedan
protegidos en Chromium. Las cinco colecciones se revalidan visualmente en Landing, RSVP y acceso Admin, en móvil y
escritorio. El countdown usa una fila geométrica común para cifras y anillos, verificada también en tablet; Magnolia
incorpora una apertura v2 con corredor de lectura central en sus tres proporciones responsive.

**Cuarto incremento — 7.4B:** accesibilidad y automatización. Skip-link, focus trap, landmarks, `role="timer"`,
errores accesibles y foco inicial en login cierran la cobertura de lector de pantalla. Admin propaga errores reales
y corrige el `loading` inicial. `vite.config.ts` incorpora presupuestos de bundle y `deploy.yml` ejecuta smoke test
automático. Quedan pendientes validación en dispositivos físicos y Lighthouse/Core Web Vitals.

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
| Sprints 6.4–6.6.6 | Completado | Theme Engine v2 y baseline visual de cinco colecciones       |

El inventario de evolutivos y sus condiciones se mantiene en
[`PRODUCT_BACKLOG.md`](./PRODUCT_BACKLOG.md). Una entrada en backlog no equivale a compromiso de implementación.

# Roadmap

## Estado

El producto continúa en fase previa a `1.0.0`. La arquitectura configurable, Theme Engine v2 y el baseline visual de las
cinco colecciones están consolidados, y desde el 2026-09-04 **no queda trabajo de código pendiente que pueda hacerse
sin desbloquear algo externo**.

Lo que separa al producto de `1.0.0` se reparte en tres categorías, y ninguna es implementación:

1. **Revisión humana** — aprobación artística de `lavender` y `terracotta`, repaso de las cadenas búlgaras por un
   hablante nativo, y validación en Safari iOS y Chrome Android sobre hardware real.
2. **Infraestructura externa** — los siete pasos de activación de la purga, la primera ejecución de los gates de CI, la
   medición Lighthouse y los recorridos e2e contra un Supabase desplegado.
3. **Bloqueante legal** — ninguna invitación con invitados reales puede publicarse antes de que el cron de purga
   funcione: los siete días de conservación son una declaración del artículo 13, no una promesa comercial.

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

### Sprint 7.4 — QA de release · Completado · P1

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
y corrige el `loading` inicial —cierto en la infraestructura desde este incremento, pero el flujo de edición no lo
mostraba: el modal se cerraba antes de que el error llegara a verse, corregido después—. `vite.config.ts` incorpora presupuestos de bundle y `deploy.yml` ejecuta smoke test
automático. Quedan pendientes validación en dispositivos físicos y Lighthouse/Core Web Vitals.

**Quinto incremento — 7.4C:** cierre de la deuda de código detectable en local. Ocho claves `admin.actions.*` existían
solo en español y el panel las mostraba así en inglés y búlgaro; un contrato de paridad de catálogos impide la
recaída. Tres dependencias de runtime sin uso salen del manifiesto, una de ellas arrastrando Puppeteer. El build emite
una Content-Security-Policy con el origen real de Supabase, verificada por el smoke test del despliegue. Los errores de
consola dejan de llegar a producción, donde exponían datos de invitados. La matriz de temas añade 320 px y las Edge
Functions pasan un type-check en contenedor. Trabajo ejecutado en local sin Pull Request: el repositorio todavía no
existe, así que el principio 6 no pudo aplicarse.

**Cierre con arrastre.** El sprint se da por cerrado porque su trabajo de código está completo y verificado. Lo que
queda no es implementación y por tanto no puede completarse dentro de un sprint de QA: dispositivos físicos,
Lighthouse y la aprobación artística de `lavender` y `terracotta` pasan a `7.5B` con su condición de bloqueo intacta.

### Sprint 7.5 — Deuda de código y release candidate · 7.5A completado · 7.5B bloqueado · P1

**Objetivo:** terminar el código que no depende de nada externo y, después, publicar `1.0.0` solo cuando no existan
bloqueos conocidos.

**7.5A — Deuda de código no bloqueada · Completado el 2026-09-04.** Único tramo ejecutable sin desplegar nada.
Unificación del modelo de carga de locales con cadena de fallback explícita —el backlog lo pedía «con valor
demostrado» y el fallo de las ocho claves lo demuestra—; guardia de runtime para la Content-Security-Policy contra el
build servido, que hoy solo se comprueba a mano; confirmación previa al borrado con historial de auditoría de las
mutaciones administrativas; y detalle móvil para respuestas largas. El historial de auditoría crea datos personales
nuevos, así que la purga a siete días lo alcanza por clave foránea en cascada, y el banco de pruebas local falla si
deja de hacerlo.

Salida verificada: 137 unitarias, 46 e2e, 4 de Content-Security-Policy y `db:verify` completo. Dos resultados fuera de
lo previsto: la política de seguridad perdió `'unsafe-inline'` al comprobarse que no hacía falta, y se corrigió un
falso positivo preexistente en la matriz de temas que fallaba 1 de cada 3 ejecuciones.

**7.5B — Release candidate.** Congelación funcional, checklist completo, versionado coherente, smoke test del
despliegue, rollback documentado y changelog final. Arrastra los pendientes de 7.4: dispositivos físicos, Lighthouse y
Core Web Vitals, y la aprobación artística de los dos temas nuevos. **Hasta completar esos puntos no se prepara
`1.0.0`.**

## Sprint 8 — Migración de hosting a Cloudflare Pages · 8.1, 8.2, 8.3 y 8.5 completadas · 8.4 bloqueada · P1

**Objetivo:** servir la invitación desde Cloudflare Pages, con las cabeceras HTTP que GitHub Pages
no permite, y admitir un despliegue por boda desde el mismo repositorio.

Los workflows se quedan en GitHub: Cloudflare recibe el resultado y no construye nada, de modo que
ninguna de las puertas de calidad de `deploy.yml` —migraciones, deriva de `schema.sql`, e2e, Edge
Function— se pierde en el camino.

**Cinco fases:** publicar en `*.pages.dev`; cabeceras reales, que cierran el `frame-ancestors` que
7.5A dejó abierto; despliegue parametrizado por invitación; dominio propio, bloqueado hasta que
exista uno; y retirada de GitHub Pages con el barrido documental correspondiente.

**Resultado el 2026-09-04:** 8.1, 8.2 y 8.5 entregadas y verificadas en local; 8.3 **reducida** al
comprobar que parametrizar la invitación era abstracción especulativa —hay una sola invitación y 31
archivos la importan—, así que se documentó el modelo de instanciación en vez de construir el
mecanismo. 8.4 queda bloqueada hasta que exista un dominio. Falta el primer push real, que confirma
los dos detalles del workflow que no pudieron verificarse sin red.

**Fuera de alcance, decidido el 2026-09-04:** servir varias bodas desde un único despliegue —exige
selección de invitación en runtime y reabre la comparación con Astro— y el paso a rutas reales, que
tocaría los 46 recorridos e2e y la decisión de no indexar.

**No bloquea ni lo bloquea `7.5B`,** pero cambia dos de sus puntos: el smoke test deja de tener
subpath y el rollback pasa a ser el de Cloudflare. Conviene ejecutar 8.1 y 8.2 antes de abrir
`7.5B`. Detalle en [`SPRINT_8_PLAN.md`](./SPRINT_8_PLAN.md).

## Sprint 9 — Puesta en producción · Planificado · P0

**Objetivo:** cerrar todo lo que no puede hacerse sin salir de la máquina, y decidir `1.0.0`.

Absorbe `7.5B` y la fase `8.4`, que dependían de las mismas puertas externas. No queda trabajo de
código pendiente: lo que separa al producto de `1.0.0` es infraestructura, verificación contra un
despliegue real y juicio humano.

**El orden es una dependencia, no una preferencia.** Sin repositorio no hay push, ni CI, ni
despliegue, así que `git init` es la fase cero; las extensiones y los secretos de Vault deben estar
antes del primer push que incluya sus migraciones; y **ninguna invitación con invitados reales sale
antes de que el cron de purga funcione**, porque los siete días de conservación son una declaración
del artículo 13.

**Seis fases:** repositorio; infraestructura de Supabase; Cloudflare y primer despliegue;
verificación contra lo real —CI, e2e contra un stack desplegado, Lighthouse—; juicio humano
—búlgaro nativo, aprobación artística, dispositivos físicos—, que puede ir en paralelo desde el
primer día; dominio propio, opcional; y release candidate.

Detalle en [`SPRINT_9_PLAN.md`](./SPRINT_9_PLAN.md).

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

# Estrategia y operación de pruebas

## Objetivo

Detectar regresiones antes de integrar cambios mediante capas rápidas, aisladas y proporcionales al riesgo. La suite no
utiliza datos reales ni se conecta a Supabase alojado desde una Pull Request.

La decisión de herramientas y sus límites se registra en
[ADR-016 — Stack de pruebas y quality gates](./adr/ADR-016-testing-stack-and-quality-gates.md).

## Requisitos locales

- Node 24;
- pnpm 10.34.5 mediante Corepack;
- Docker Desktop para Supabase local;
- Chromium, Firefox y WebKit administrados por Playwright;
- Deno, solo para `pnpm check:functions`. El resto de la suite no lo necesita.

Instala las dependencias y el navegador una vez:

```bash
corepack pnpm install --frozen-lockfile
pnpm exec playwright install chromium firefox webkit
```

## Comandos

| Comando              | Cobertura                                  |
|----------------------|--------------------------------------------|
| `pnpm test`          | Unitarias e integración con Vitest         |
| `pnpm test:watch`    | Reejecución interactiva durante desarrollo |
| `pnpm test:coverage` | Informe V8 informativo en `coverage/`      |
| `pnpm test:e2e`        | Gate rápido Playwright en Chromium                              |
| `pnpm test:e2e:matrix` | Matriz manual completa, ejecutada en dos fases secuenciales     |
| `pnpm test:e2e:matrix:chromium` | Chromium, responsive y temas con un worker          |
| `pnpm test:e2e:matrix:compat` | Firefox, WebKit y perfiles móviles con un worker       |
| `pnpm test:e2e:ui`     | Depuración interactiva de Playwright                            |
| `pnpm test:db`         | pgTAP contra un stack Supabase ya levantado                     |
| `pnpm run db:verify`   | **Recomendado en local.** Aplica todas las migraciones a un Postgres desechable en Docker, corre las suites pgTAP y regenera `supabase/schema.sql` |
| `pnpm run db:verify:down` | Limpia el harness si una ejecución quedó a medias                 |
| `pnpm check:functions` | `deno check` sobre las Edge Functions, el único código que no pasa por `tsc -b`. Exige Deno en el host |
| `pnpm run check:functions:docker` | **Recomendado en local.** Lo mismo dentro de un contenedor, sin instalar Deno |
| `pnpm run test:e2e:csp` | Navegador contra el build servido: falla si la CSP bloquea algo o si desaparece               |
| `pnpm smoke:test`      | Contra un despliegue (`SMOKE_TEST_URL`): las tres rutas responden y la CSP está y nombra Supabase |
| `pnpm quality`         | Lint, Vitest y build                                            |

`pnpm test:db` requiere una instancia iniciada:

```bash
pnpm exec supabase start
pnpm test:db
```

Alternativa sin levantar el stack completo, y la que corre en CI:

```bash
pnpm run db:verify
```

Levanta un contenedor con **la misma imagen de Postgres que usa Supabase** —así pg_cron, pg_net, `supabase_vault` y
pgTAP son las extensiones reales, no sustitutos—, aplica las migraciones en orden, ejecuta las mismas suites de
`supabase/tests/database/` y regenera `supabase/schema.sql`. El workflow falla si ese archivo queda desincronizado.

Las suites pgTAP se ejecutan **por rol** (`SET LOCAL ROLE anon` / `authenticated` más el claim del JWT). Comprobar que
una policy existe en `pg_policies` no prueba que haga nada; hay que ejercitarla.

La reconstrucción completa del esquema se realiza con:

```bash
pnpm exec supabase db reset
pnpm test:db
```

`db reset` destruye exclusivamente la base de datos local. Nunca debe ejecutarse con `--linked` durante pruebas.

## Edge Functions

`supabase/functions/` queda fuera de `tsconfig.app.json` y Vite no las compila, así que `tsc -b` nunca las mira.
Durante un tiempo ESLint fue la única herramienta que leyó el único artefacto Deno que corre en producción y un error
de tipos habría aparecido en el cron nocturno, no en el pipeline.

```bash
pnpm check:functions
```

Descarga los imports remotos que declara la función (`https://esm.sh/...`), así que necesita red la primera vez.

Comprobado en verde con Deno 2.9.6 mediante el harness Docker de `supabase/functions-check/`, que evita instalar Deno en el host.
El job `edge-functions` de CI, en cambio, todavía no ha corrido nunca. Las tres vías y el motivo de no declarar Deno
como dependencia de pnpm están en [Type-check de las Edge Functions](./EDGE_FUNCTION_TYPECHECK.md).

## Organización

```text
src/**/*.test.ts          Unitarias y contratos puros
src/**/*.test.tsx         Integración de React y accesibilidad
e2e/*.spec.ts             Recorridos visibles de producto
supabase/tests/database/  Estructura, privilegios y RLS con pgTAP
```

Los tests permanecen junto al código que protegen cuando comparten su unidad conceptual. Los recorridos y las pruebas
SQL viven en carpetas propias porque atraviesan varias capas.

`locales/catalogs.test.ts` es un caso aparte: no protege una unidad, protege un contrato que ninguna otra capa ve.
`bg.ts` se construye con el spread de `en.ts`, así que TypeScript cuenta como presente cualquier clave heredada; y
`t()` resuelve contra el catálogo por defecto antes de rendirse, de modo que una clave definida solo en `es.ts` se
renderiza en español dentro del panel inglés en vez de fallar. Ni siquiera salta el aviso de DEV, porque ese fallback
resolvió. El test afirma dos cosas distintas: paridad de claves entre los tres catálogos, y que ningún valor búlgaro
coincide con su original inglés salvo los de la allowlist —marcas, símbolos de precio, endónimos y el dominio de
ejemplo reservado por la RFC 2606—.

## Datos de prueba

- usar nombres, emails, UUID y respuestas inequívocamente ficticios;
- no copiar payloads, capturas ni exports reales;
- aislar los tests SQL dentro de `BEGIN` y `ROLLBACK`;
- interceptar la API en E2E cuando se valida la interfaz y no la base de datos;
- cubrir por separado los formularios OTP y password, incluidos errores neutros y nombres accesibles;
- evitar snapshots extensos que oculten la intención del caso.

## Criterio de selección

Preferir consultas accesibles y comportamiento observable:

- roles, labels y mensajes visibles en Playwright y Testing Library;
- funciones y resultados públicos en unitarias;
- políticas y privilegios reales en pgTAP.

No seleccionar elementos por clases CSS salvo que la clase sea el comportamiento bajo prueba. No probar detalles
internos de React ni simular RLS mediante mocks.

## Quality Gates de Pull Request

`.github/workflows/quality.yml` ejecuta tres jobs independientes:

### Application quality

1. instalación con lockfile;
2. lint;
3. Vitest;
4. build;
5. Playwright Chromium;
6. informe HTML disponible como artefacto, especialmente ante fallos.

### Database quality

1. Supabase CLI 2.111.0;
2. stack local nuevo;
3. `db lint`;
4. pgTAP;
5. cierre del stack incluso si falla un gate.

### Edge Function quality

1. Deno estable;
2. `deno check` sobre `supabase/functions/`.

Los jobs no reciben secretos de producción. Las variables de Vite del job son valores locales ficticios y las llamadas
RSVP se interceptan dentro de Playwright.

## Diagnóstico

### Vitest no encuentra DOM

Comprueba que el archivo coincide con `src/**/*.test.{ts,tsx}` y que `vitest.config.ts` mantiene `jsdom` y
`src/test/setup.ts`.

### Playwright no encuentra un navegador

```bash
pnpm exec playwright install chromium firefox webkit
```

### La tabla de Admin no aparece en ningún recorrido

No es un fallo. Está detrás de la autenticación y la suite no puede autenticarse sin un Supabase desplegado, así que
los recorridos se detienen en la pantalla de acceso. Su marcado se cubre en `ResponsesTable.test.tsx`; su layout
responsive —incluida la vista apilada por debajo de 768 px— no tiene cobertura automática.

### Playwright no inicia la aplicación

Comprueba que el puerto `4173` está libre. El servidor se inicia automáticamente y se reutiliza en local si ya responde
la aplicación correcta.

### `pnpm check:functions` falla con `deno: command not found`

Deno no viene con las dependencias del proyecto. Instálalo aparte; en CI lo resuelve `denoland/setup-deno`.

### pgTAP no conecta

Comprueba Docker y ejecuta:

```bash
pnpm exec supabase status
pnpm exec supabase start
```

### Una prueba RLS devuelve demasiadas filas

No relajes la aserción. Revisa primero el rol, `request.jwt.claim.sub`, la membresía y la política aplicada.

## Evolución

Chromium permanece como gate rápido de cada Pull Request. `pnpm test:e2e:matrix` encadena una primera fase Chromium y
otra de compatibilidad con Firefox, WebKit, Pixel 5 e iPhone 13 emulados. Cada fase usa un worker para evitar falsos
negativos por saturación y puede ejecutarse por separado durante el diagnóstico. Los perfiles emulados no sustituyen
Safari iOS y Chrome Android en dispositivos físicos.

La Content-Security-Policy se comprueba en dos capas, porque ninguna de las dos basta sola. `pnpm smoke:test` corre en
`deploy.yml` contra la URL desplegada —la única que lleva la política con el origen real— y falla si el `<meta>` no
está o si su `connect-src` no autoriza un origen de Supabase; lee HTML, así que no puede saber si la política bloquea
algo que la aplicación necesita. `pnpm run test:e2e:csp` cubre eso otro: un navegador contra
`wrangler pages dev`, que recoge los eventos `securitypolicyviolation` de Landing, RSVP, acceso Admin y los
desplegables de idioma y mapas.

Vive en una configuración propia porque necesita el build y el servidor de la suite principal sirve `pnpm dev`; el
puerto 4174 permite ejecutar ambas a la vez. `playwright.config.ts` ignora `csp.spec.ts` a propósito: contra el
servidor de desarrollo no hay política y el recorrido pasaría sin proteger nada. Por eso el propio spec afirma primero
que la respuesta trae la cabecera.

Esa exclusión hay que **repetirla en cada proyecto que estreche la lista**: un `testIgnore` de proyecto sustituye al
de la configuración, no se suma a él. Los cuatro proyectos de compatibilidad usan `CSP_AND_MATRIX_SUITES` por eso.
Olvidarlo no da error: el spec se recoge contra el servidor equivocado y falla en su primera aserción.

La evidencia de Sprint 7.4 se registra en
[Matriz de QA de release](../05-audits/RELEASE_QA_MATRIX.md). Un nuevo navegador solo entrará en cada Pull Request cuando
su señal compense el tiempo y mantenimiento adicionales.

Las estrategias Admin comparten sesión y RLS. La invitación canónica mantiene OTP en los recorridos E2E; la selección
password, `signInWithPassword`, credenciales rechazadas y composición del formulario se cubren en Vitest. Una release
configurada con password debe añadir su comprobación visual al QA específico de esa invitación.

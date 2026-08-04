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
- Chromium, Firefox y WebKit administrados por Playwright.

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
| `pnpm test:e2e:matrix` | Matriz manual en Chromium, Firefox, WebKit y perfiles móviles   |
| `pnpm test:e2e:ui`     | Depuración interactiva de Playwright                            |
| `pnpm test:db`         | Migraciones, grants y RLS mediante pgTAP                        |
| `pnpm quality`         | Lint, Vitest y build                                            |

`pnpm test:db` requiere una instancia iniciada:

```bash
pnpm exec supabase start
pnpm test:db
```

La reconstrucción completa del esquema se realiza con:

```bash
pnpm exec supabase db reset
pnpm test:db
```

`db reset` destruye exclusivamente la base de datos local. Nunca debe ejecutarse con `--linked` durante pruebas.

## Organización

```text
src/**/*.test.ts          Unitarias y contratos puros
src/**/*.test.tsx         Integración de React y accesibilidad
e2e/*.spec.ts             Recorridos visibles de producto
supabase/tests/database/  Estructura, privilegios y RLS con pgTAP
```

Los tests permanecen junto al código que protegen cuando comparten su unidad conceptual. Los recorridos y las pruebas
SQL viven en carpetas propias porque atraviesan varias capas.

## Datos de prueba

- usar nombres, emails, UUID y respuestas inequívocamente ficticios;
- no copiar payloads, capturas ni exports reales;
- aislar los tests SQL dentro de `BEGIN` y `ROLLBACK`;
- interceptar la API en E2E cuando se valida la interfaz y no la base de datos;
- evitar snapshots extensos que oculten la intención del caso.

## Criterio de selección

Preferir consultas accesibles y comportamiento observable:

- roles, labels y mensajes visibles en Playwright y Testing Library;
- funciones y resultados públicos en unitarias;
- políticas y privilegios reales en pgTAP.

No seleccionar elementos por clases CSS salvo que la clase sea el comportamiento bajo prueba. No probar detalles
internos de React ni simular RLS mediante mocks.

## Quality Gates de Pull Request

`.github/workflows/quality.yml` ejecuta dos jobs independientes:

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

### Playwright no inicia la aplicación

Comprueba que el puerto `4173` está libre. El servidor se inicia automáticamente y se reutiliza en local si ya responde
la aplicación correcta.

### pgTAP no conecta

Comprueba Docker y ejecuta:

```bash
pnpm exec supabase status
pnpm exec supabase start
```

### Una prueba RLS devuelve demasiadas filas

No relajes la aserción. Revisa primero el rol, `request.jwt.claim.sub`, la membresía y la política aplicada.

## Evolución

Chromium permanece como gate rápido de cada Pull Request. `pnpm test:e2e:matrix` ejecuta manualmente Firefox, WebKit,
Pixel 5 y iPhone 13 emulados con un worker para evitar falsos negativos por saturación. Los perfiles emulados no
sustituyen Safari iOS y Chrome Android en dispositivos físicos.

La evidencia de Sprint 7.4 se registra en
[Matriz de QA de release](../05-audits/RELEASE_QA_MATRIX.md). Un nuevo navegador solo entrará en cada Pull Request cuando
su señal compense el tiempo y mantenimiento adicionales.

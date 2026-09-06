# `functions-check` — type-check de las Edge Functions

Contenedor desechable que ejecuta `deno check` sobre `../functions/` sin instalar Deno en el Mac.
Mismo planteamiento que `../local/`, el harness de las migraciones: la herramienta vive en Docker,
no en el host.

## Por qué hace falta

`supabase/functions/` es el único código de producción que no lee ningún compilador:

- `tsconfig.app.json` incluye solo `src`;
- `tsconfig.node.json` incluye solo `vite.config.ts`, `vitest.config.ts` y `playwright.config.ts`;
- Vite no las compila.

ESLint era la única herramienta que abría ese archivo, y ESLint no comprueba tipos. Un error de
tipos aparecía en la ejecución nocturna del cron —el aviso previo al borrado de respuestas de
invitados—, no en el pipeline.

`tsc` tampoco serviría apuntándolo ahí: la función usa `Deno.env.get` y `Deno.serve`, que solo
existen en el runtime de Deno.

## Uso

```bash
pnpm run check:functions:docker    # desde la raíz del proyecto
```

O directamente desde esta carpeta:

```bash
./run.sh            # comprueba; devuelve != 0 si hay error de tipos
./run.sh --clean    # lo mismo, tirando antes la caché de descargas
```

## Red

La primera ejecución **necesita red**: descarga la imagen, las librerías de tipos de Deno y el
`https://esm.sh/@supabase/supabase-js@2.110.2` que la función importa. Todo queda en el volumen
`deno-cache` y las siguientes ejecuciones no vuelven a salir.

## Resultado

Ejecutado el 4 de septiembre de 2026 con Deno 2.9.6 / TypeScript 6.0.3: **pasa limpio**. Era la
primera vez que una herramienta de tipos leía ese archivo, así que un fallo habría sido un
resultado igual de válido.

La imagen queda pineada en `denoland/deno:alpine-2.9.6`, como el resto del repositorio pinea sus
herramientas (`supabase/postgres:17.6.1.166`, Supabase CLI `2.111.0`, Playwright `1.62.1`). Un
`:alpine` móvil cambiaría el compilador por debajo de un resultado en verde sin avisar.

## Alcance

Que `deno check` pase no significa que la función funcione. Sigue sin ejecutarse de verdad:
`net.http_post`, el envío por Resend y el marcado de bodas avisadas dependen de los pasos de
infraestructura de `../../docs/PURGE_DEPLOYMENT.md`.

Contexto completo y las otras dos vías (CI y Deno en el sistema) en
`../../docs/04-development/EDGE_FUNCTION_TYPECHECK.md`.

# Type-check de las Edge Functions

## Estado

**Ejecutado y en verde.** El 4 de septiembre de 2026, con Deno 2.9.6 y TypeScript 6.0.3, mediante
el harness Docker de `supabase/functions-check/`. Era la primera vez que una herramienta de tipos leía
`send-purge-warnings/index.ts`; no había errores.

El paso queda cableado en tres sitios: el job `edge-functions` de `.github/workflows/quality.yml`,
el script `pnpm check:functions` y ese harness. **El job de CI aún no ha corrido nunca**: correrá
en la primera Pull Request o push a `main` que llegue al repositorio real.

## Por qué existe

`supabase/functions/` no entra en `tsconfig.app.json` —que incluye solo `src`— ni en
`tsconfig.node.json` —que incluye solo los tres archivos de configuración—. `tsc -b` nunca la
mira y Vite no la compila. Antes de este paso, **ESLint era la única herramienta que leía el
único artefacto de producción escrito para Deno**, y ESLint no comprueba tipos.

Un error de tipos en `send-purge-warnings/index.ts` no aparecía en el pipeline: aparecía en la
ejecución nocturna del cron, que es justamente el aviso previo al borrado en duro de respuestas
de invitados.

## Qué hay que comprobar

Un solo archivo hoy: `supabase/functions/send-purge-warnings/index.ts` (77 líneas).

- importa `createClient` desde `https://esm.sh/@supabase/supabase-js@2.110.2`;
- usa `Deno.env.get` y `Deno.serve`, que solo existen en el runtime de Deno.

## Requisitos

Deno y **acceso a red**. `deno check` descarga el módulo remoto de esm.sh y las librerías de
tipos del propio Deno la primera vez; después quedan en su caché local.

## Tres formas de ejecutarlo

### 1. CI — ya configurado, no requiere nada en tu máquina

El job `edge-functions` de `quality.yml` instala Deno con `denoland/setup-deno@v2` y ejecuta:

```bash
find supabase/functions -name '*.ts' -exec deno check {} +
```

Es la vía por defecto. Correrá solo en la primera Pull Request o push a `main` que llegue al
repositorio real.

### 2. Docker — sin instalar nada en el sistema

Coherente con `pnpm run db:verify`, que ya resuelve su herramienta con Docker en lugar de exigirla
en el host:

Hay un harness montado para esto en `supabase/functions-check/`, junto a `supabase/local/`, que
hace lo mismo con Postgres. Monta `supabase/functions/` en solo lectura y guarda las descargas en
un volumen, de modo que solo la primera ejecución toca la red:

```bash
pnpm run check:functions:docker
```

**No verificado:** la imagen `denoland/deno:alpine` no se ha resuelto desde esta máquina por no
tener red, y por eso está sin pinear. Confírmala y fija una versión.

### 3. Deno en el sistema

```bash
brew install deno
pnpm check:functions
```

## Por qué no se declara Deno como dependencia de pnpm

Es la pregunta razonable y la respuesta es que no ahorra nada:

- **Sigue descargando el binario.** Los paquetes npm que «instalan Deno» son envoltorios: un
  `postinstall` que se baja el ejecutable de las releases de GitHub. La descarga no desaparece,
  solo se mueve de un comando explícito a un `pnpm install` silencioso, y pasa a ocurrir en cada
  máquina y en cada job de CI que instale dependencias, incluidos los que no tocan las funciones.
- **Reintroduce el patrón que acabamos de quitar.** El manifiesto arrastraba `impeccable`, que
  traía `puppeteer` como dependencia opcional y con él un Chromium entero. Añadir ahora un
  envoltorio con `postinstall` que descarga un binario es exactamente la misma clase de
  dependencia, con la misma superficie de cadena de suministro.
- **CI ya lo resuelve mejor.** `denoland/setup-deno` es la acción oficial, cachea el binario entre
  ejecuciones y solo se ejecuta en el job que lo necesita.
- **En local es opcional.** `pnpm check:functions` es el único comando de la suite que pide Deno.
  Todo lo demás —lint, Vitest, build, Playwright, `db:verify`— funciona sin él.

Si aun así se prefiere tenerlo en el manifiesto, la opción 2 (Docker) da el mismo resultado sin
binario en el host y sin tocar `package.json`.

## Qué queda

1. ~~Ejecutar cualquiera de las tres vías.~~ Hecho con el harness Docker.
2. Retirar la Edge Function de la lista «Lo que no se ha verificado» de
   [`CIERRE_REVIEW.md`](../CIERRE_REVIEW.md), que sigue afirmando que no la comprueba ninguna
   herramienta.
3. Confirmar que el job `edge-functions` de CI pasa en su primera ejecución real.
4. Borrar este documento cuando 2 y 3 estén hechos.

Ojo: que `deno check` pase **no** significa que la función funcione. Sigue sin ejecutarse de
verdad: `net.http_post`, el envío por Resend y el marcado de bodas avisadas siguen sin cubrir, y
eso depende de los pasos de infraestructura de [`PURGE_DEPLOYMENT.md`](../PURGE_DEPLOYMENT.md).

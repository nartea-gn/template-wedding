# Sprint 8 — Migración de hosting a Cloudflare Pages

## Estado

- **Estado:** planificado, sin empezar
- **Creado:** 2026-09-04
- **Entrada:** Sprint 7.5A cerrado. `7.5B` sigue bloqueado y **no depende de este sprint**
- **Salida:** la invitación se sirve desde Cloudflare Pages con cabeceras HTTP reales, y el
  despliegue admite más de una boda desde el mismo repositorio

**Los workflows siguen en GitHub.** Cloudflare recibe el resultado, no construye nada. Esta es la
decisión que gobierna el sprint entero y la razón de que las puertas de calidad no se toquen.

## Por qué

Cuatro motivos, tres de ellos hosting y uno que no lo es:

| Motivo | Qué resuelve |
|---|---|
| Cabeceras HTTP reales | `frame-ancestors` es imposible en un `<meta>`. Quedó abierto en 7.5A |
| Dominio propio y raíz del sitio | Elimina `base: '/template-wedding/'` y acorta la URL que recibe el invitado |
| Preparar multi-boda | Un despliegue por boda. **No requiere cambios en el motor** |
| Salir de GitHub Pages | Concentrar la infraestructura |

### Lo que este sprint NO hace

- **No sirve varias bodas desde un despliegue.** Eso exigiría selección de invitación en runtime,
  sacar la inyección de fuentes del build —perdiendo la mejora del ítem 30— y reabriría la
  comparación con Astro que [`CIERRE_REVIEW.md`](../CIERRE_REVIEW.md) deja documentada. Es otro
  sprint, si alguna vez hace falta.
- **No cambia el enrutado.** `HashRouter` y las URLs `/#/rsvp` se mantienen. Cloudflare permitiría
  rutas reales con `_redirects`, pero eso toca los 46 recorridos e2e y la decisión de no indexar.
  Decidido el 2026-09-04: se pospone.

## Relación con Sprint 7.5B

`7.5B` no bloquea a este sprint, pero **este sí cambia lo que `7.5B` tendrá que verificar**, y
conviene no descubrirlo entonces:

- `7.5B` pide «smoke test de URL pública, **subpath** y hash routes»
  ([`SPRINT_7_PLAN.md`](./SPRINT_7_PLAN.md), alcance de 7.5B). Tras la fase 8.1 no hay subpath: ese
  punto pasa a ser raíz del sitio y hash routes.
- `7.5B` pide «procedimientos de rollback de frontend». El de GitHub Pages es redesplegar; el de
  Cloudflare es promover un despliegue anterior, que es más rápido y merece quedar escrito con sus
  pasos reales.

Si `7.5B` se ejecuta antes que este sprint, ambos puntos habrá que rehacerlos. **Recomendación:**
completar al menos las fases 8.1 y 8.2 antes de abrir `7.5B`, para no documentar dos veces un
rollback y un smoke que van a cambiar.

## Restricciones

1. Ninguna puerta de calidad se pierde. `deploy.yml` verifica migraciones, comprueba la deriva de
   `schema.sql`, ejecuta los e2e, aplica migraciones y despliega la Edge Function. Solo cambia el
   paso final de publicación.
2. Ninguna fase deja el sitio sin CSP, ni siquiera de forma transitoria.
3. Cada fase termina con el gate completo en verde.

## Puntos de acoplamiento con GitHub Pages

Inventario cerrado el 2026-09-04. Cualquier otro que aparezca se añade aquí:

| Archivo | Qué asume |
|---|---|
| `vite.config.ts:77` | `base: '/template-wedding/'` |
| `playwright.config.ts:17,50` | `baseURL` y `url` con el subpath |
| `playwright.csp.config.ts:19,26` | Lo mismo, en el puerto 4174 |
| `.github/workflows/deploy.yml` | `permissions: pages: write`, `environment: github-pages`, `actions/deploy-pages@v4` |
| `README.md:25` | «GitHub Pages con `HashRouter` y base `/template-wedding/`» |
| `docs/01-architecture/ARCHITECTURE.md:36` | Declara GitHub Pages como host |
| `docs/05-audits/FRONTEND.md:18` | Justifica `HashRouter` y el `base` por GitHub Pages |
| `docs/04-development/adr/ADR-012-*` | Su título es «before Pages deployment» |
| `docs/01-architecture/DATABASE_MIGRATIONS.md:69` | Paso 6: «deploy the artifact to GitHub Pages». **Añadido durante 8.1**, no estaba en el inventario inicial |
| `README.md:150` | «despliega el artefacto en GitHub Pages». **Añadido durante 8.1** |

## Sin verificar

No hay red en la máquina donde se planificó esto. Confirmar antes de darlos por buenos:

- [x] `wrangler pages dev` sirve el archivo `_headers` — **confirmado el 2026-09-04** con wrangler 4.129.0
- [ ] Nombre e invocación exactos del despliegue con `wrangler pages deploy`
- [ ] Si Cloudflare añade HSTS por su cuenta o hay que declararlo en `_headers`

---

## Fase 8.1 — Publicar en Cloudflare Pages

**Objetivo:** el mismo producto, servido desde `*.pages.dev`, sin tocar producto ni enrutado.

- [x] `base: '/'` en `vite.config.ts`
- [x] `baseURL` y `url` sin subpath en `playwright.config.ts`
- [x] Lo mismo en `playwright.csp.config.ts`
- [~] ~~`wrangler` como devDependency~~ — **aplazado a 8.2 por decisión, no por olvido.** En 8.1
      solo hace falta en CI, y `cloudflare/wrangler-action` lo instala allí. Declararlo en el
      manifiesto repetiría el patrón que 7.4C eliminó: una herramienta pesada que casi nadie
      ejecuta en local. En 8.2 sí se necesita, para `wrangler pages dev`
- [x] `deploy.yml`: sustituir `actions/upload-artifact` + `actions/deploy-pages` por la publicación
      con `wrangler`, y retirar `permissions: pages/id-token` y `environment: github-pages`
- [x] El job `smoke` recibe la URL del despliegue de Cloudflare
- [x] `README.md`, `ARCHITECTURE.md` y `FRONTEND.md` dejan de afirmar GitHub Pages
- [x] Gate completo en verde

**Secretos nuevos en GitHub** — pasos manuales, no ejecutables desde aquí:

- [ ] `CLOUDFLARE_API_TOKEN`, con permiso de edición sobre Cloudflare Pages
- [ ] `CLOUDFLARE_ACCOUNT_ID`
- [ ] Proyecto de Pages creado en la cuenta

**Criterio de salida:** un push a `main` publica en Cloudflare y el smoke test pasa contra la URL
real. Hasta entonces la fase queda verificada solo en local.

### Registro de ejecución 8.1

**Completada en local el 2026-09-04.** Pendiente únicamente de los pasos manuales de Cloudflare.

**Cambios aplicados**

| Archivo | Cambio |
|---|---|
| `vite.config.ts` | `base: '/template-wedding/'` → `'/'` |
| `playwright.config.ts` · `playwright.csp.config.ts` | `baseURL` y `url` sin subpath |
| `.github/workflows/deploy.yml` | Nombre del workflow, `permissions` reducidos a `contents: read`, sin `environment: github-pages`, y `cloudflare/wrangler-action@v3` en lugar de `upload-pages-artifact` + `deploy-pages` |
| `README.md` · `ARCHITECTURE.md` · `FRONTEND.md` · `DATABASE_MIGRATIONS.md` | Describen Cloudflare |

**Verificación:** `tsc -b`, lint, 137 unitarias, 46 recorridos e2e, 4 de CSP, `db:verify` con sus
tres comprobaciones, type-check de Edge Functions y smoke contra `http://127.0.0.1:4173` sin
subpath. El build emite `/assets/...` y `/favico.png` en la raíz.

**Lo que apareció y no estaba previsto**

- El inventario de acoplamiento estaba **incompleto**: faltaban `DATABASE_MIGRATIONS.md:69` y
  `README.md:150`. Corregidos y añadidos al inventario de arriba.
- Un segundo barrido encontró afirmaciones vivas en `PRODUCT_VISION.md`, `SECURITY_THREAT_MODEL.md`
  y `MEDIA.md`. **No se tocaron aquí**: pertenecen a la fase 8.5 y están anotadas allí. La del
  modelo de amenazas importa más de lo que parece, porque su alcance cambia con el host.
- No existían `.nojekyll`, `CNAME` ni `404.html`, así que la migración no arrastra restos de Pages.

**Sin verificar en esta fase** — sin red, y ya listado al principio del documento:

- que `cloudflare/wrangler-action@v3` exponga su URL como `deployment-url`, que es de donde el job
  `smoke` la toma;
- que la invocación `pages deploy dist --project-name=... --branch=main` sea la correcta.

Ambas se confirman en el primer push real. Si la salida se llamara distinto, el smoke recibiría una
URL vacía y **fallaría en rojo**, que es el modo correcto de equivocarse.

---

## Fase 8.2 — Cabeceras HTTP reales

**Objetivo:** cerrar el hueco que 7.5A dejó abierto y aprovechar lo único que un `<meta>` no puede
dar.

- [x] `wrangler` como devDependency, fijado en `4.129.0` — aplazado desde 8.1, aquí sí hace falta
- [x] El build emite `dist/_headers`, generado por el mismo plugin que hoy compone la CSP: el
      origen de Supabase sigue siendo una variable de compilación
- [x] La CSP se sirve como cabecera y **gana `frame-ancestors 'none'`**
- [x] Se retira el `<meta http-equiv>` para no dejar dos fuentes de verdad
- [x] `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`, `Referrer-Policy` y
      `Permissions-Policy`
- [x] Caché inmutable para `/assets/*`, que ya llevan hash en el nombre
- [x] `playwright.csp.config.ts` sirve con `wrangler pages dev` en vez de `vite preview`
- [x] `scripts/smoke-test.mjs` lee la cabecera de respuesta en vez del `<meta>`
- [x] Gate completo en verde, con **5** recorridos de CSP contra cabeceras reales

### Por qué cambiar el servidor del recorrido es parte de esta fase

Una CSP puede viajar de dos formas: dentro del HTML, como `<meta http-equiv>`, o como cabecera de
respuesta. Hoy usamos la primera porque GitHub Pages sirve archivos y no puede añadir cabeceras, y
por eso `frame-ancestors` es imposible: el navegador ignora esa directiva cuando llega en un
`<meta>`. Esta fase existe para pasar a la segunda forma.

`_headers` es una convención **de Cloudflare**. Nadie más sabe qué es. El recorrido de CSP sirve
hoy el build con `vite preview` (`playwright.csp.config.ts:25`), para el que `_headers` es un
archivo cualquiera dentro de `dist/`: lo ignora. Servida así, la página **no llevaría ninguna
política**, y un recorrido que cuenta violaciones encontraría cero. No porque la política esté
bien: porque no hay política.

Eso está previsto. `e2e/csp.spec.ts:38` afirma que el `<meta>` existe antes de contar nada:

```ts
await expect(page.locator('meta[http-equiv="Content-Security-Policy"]')).toHaveCount(1)
```

Así que al retirar el `<meta>` el recorrido **falla en rojo**, no pasa en falso. Lo mismo el smoke
test, que busca el `<meta>` con una expresión regular en `scripts/smoke-test.mjs:35`.

**El riesgo no es que el test engañe: es que falle y la salida fácil sea callarlo.** Borrar esa
línea porque «ya no aplica, ahora va en cabecera» deja el recorrido en verde y completamente
vacío, sin nada que proteger, y sin síntoma visible: la web funciona igual, solo que sin política.
Quien lo haga tendrá además la sensación de estar limpiando una aserción obsoleta.

Los tres cambios que sustituyen a esa línea, y que van dentro de esta fase:

| Pieza | De | A |
|---|---|---|
| Servidor del recorrido | `vite preview` | `wrangler pages dev`, que sí aplica `_headers` |
| Aserción de presencia | existe el `<meta>` | la respuesta trae la cabecera |
| Smoke test | expresión regular sobre el HTML | leer la cabecera de respuesta |

**Contingencia.** Todo esto depende de que `wrangler pages dev` aplique `_headers`, que está en la
lista de «Sin verificar» al principio del documento. Si resultara falso, esta fase necesita otro
plan: no habría forma de comprobar en local unas cabeceras que solo existirían en producción, y
habría que decidir entre conservar el `<meta>` junto a la cabecera —con dos fuentes de verdad— o
mover la verificación al smoke test contra el despliegue real, que solo corre después de publicar.
**Confirmar esa casilla antes de empezar la fase.**

**Criterio de salida:** los recorridos de CSP pasan contra cabeceras reales y una mutación que
rompa la política los hace fallar. Verificado con mutación, no solo en verde.

### Registro de ejecución 8.2

**Completada el 2026-09-04.** Toda ella verificable en local, sin depender del despliegue.

**La casilla bloqueante, resuelta primero.** `wrangler pages dev` sí aplica `_headers`:
`content-security-policy` y una cabecera de prueba llegaron en la respuesta. Sin esa confirmación
la fase habría necesitado otro plan, así que se comprobó antes de escribir nada.

**Hallazgo: Cloudflare ya envía dos de las cabeceras por su cuenta.** `Referrer-Policy:
strict-origin-when-cross-origin` y `X-Content-Type-Options: nosniff` aparecen sin declararlas. Se
declaran igualmente: un contrato de seguridad no debería descansar sobre un valor por defecto de la
plataforma que nadie aquí controla, y cuesta una línea cada uno.

**Recorrido nuevo: `refuses to be embedded in a frame`.** Es la razón de ser de la fase, y ninguna
prueba anterior podía cubrirlo. La invitación publica un IBAN; merece no poder envolverse en la
página de otro.

**Un error propio, cazado por el propio test.** La primera versión buscaba en consola
`Refused to display`. Chromium dice `Framing '...' violates`, así que el test fallaba mientras la
protección funcionaba perfectamente. Reescrito para afirmar sobre el comportamiento —el frame no
renderiza la aplicación— con dos señales independientes, `ERR_BLOCKED_BY_RESPONSE` y la mención de
la directiva, en lugar de una frase concreta que cambia entre navegadores.

**Verificado con tres mutaciones**, cada una con su mensaje propio:

| Mutación | Qué falla |
|---|---|
| Sin `frame-ancestors` | `the invitation rendered inside a frame` |
| Sin Google Fonts en `style-src` | violaciones `style-src-elem` en los cuatro recorridos |
| El build no emite `_headers` | `the response carries no Content-Security-Policy header` |

**Control negativo del smoke**, que demuestra por qué había que cambiar de servidor: apuntado a
`vite preview`, que ignora `_headers`, falla con «the response carries no Content-Security-Policy
header». Contra `wrangler pages dev` pasa y confirma además que el framing está denegado.

**Gate:** `tsc -b`, lint, 137 unitarias, 46 recorridos e2e, 5 de CSP.

**Nota para CI.** pnpm avisa de que ignora los scripts de instalación de `workerd` y `esbuild`.
`wrangler pages dev` funcionó igualmente en local, porque los binarios llegan como dependencias
opcionales precompiladas. Si el job `Content-Security-Policy tests` fallara en CI por esto, la
salida es declarar `onlyBuiltDependencies` en `package.json`.

---

## Fase 8.3 — Instanciación por boda

**Objetivo original:** hacer que la invitación fuese entrada del build. **Reducido el 2026-09-04**
al descubrir que resolvía un problema inexistente; el razonamiento está en el registro de abajo.

**Objetivo real:** confirmar que una segunda boda solo necesita variables, y dejar escrito cómo se
crea. El modelo es plantilla que se instancia, no aplicación multi-inquilino.

- [x] Verificar que ningún archivo de producción fuera de `src/invitations/` fija esta boda
- [x] Documentar el modelo de instanciación y los mandos por despliegue
- [x] Dejar medido el coste de parametrizar, por si algún día se decide
- [~] ~~La invitación pasa a ser entrada del build, resuelta por variable de entorno~~ —
      **descartado con motivo:** abstracción especulativa sin una segunda invitación que la
      justifique, y `CLAUDE.md` de este repositorio la prohíbe expresamente
- [~] ~~El plugin de fuentes lee la invitación seleccionada~~ — descartado con lo anterior
- [x] `deploy.yml` admite qué proyecto de Pages publica — ya lo hacía vía `vars`
- [x] `scripts/sync-invitation.ts` y `NARTEA_WEDDING_REGISTERED` no asumen una única boda: leen la
      invitación compilada y la variable es por despliegue
- [~] ~~Dos builds del mismo commit con invitaciones distintas~~ — no aplica al modelo reducido
- [x] Gate completo en verde

**Criterio de salida:** una segunda boda se despliega copiando el repositorio, cambiando
`src/invitations/` y creando sus secretos. Sin cambios de código. La base de datos ya lo soporta:
`wedding_slug` con RLS por invitación desde Sprint 7.1.

### Registro de ejecución 8.3

**Reducida el 2026-09-04, antes de escribir código.** La fase original construía un mecanismo de
selección de invitación. Al medir su coste apareció que no hay nada que seleccionar.

**Lo que se midió**

- **31 archivos** importan de `invitations/wedding`: `weddingInvitation` en 9, el tipo
  `WeddingMessageKey` en 4, y el resto repartido entre registro de secciones, formulario y
  catálogos.
- Parametrizar exige reescribir esas 31 rutas hacia un alias y renombrar `WeddingMessageKey`, o
  bien mapear el alias sobre el propio directorio `wedding`, lo cual **rompe `tsc`**: el compilador
  seguiría viendo el directorio real.
- **Y no se puede validar sin una segunda invitación.** Inventar una boda falsa para probar el
  interruptor sería probar el interruptor, no la necesidad.

**Por qué se descartó**

`CLAUDE.md` prohíbe expresamente las abstracciones especulativas. El paquete se llama
`template-wedding` y el README presenta el producto como motor configurable donde «la boda actual
es la primera implementación»: eso describe una plantilla que se instancia, no multi-inquilino. El
modelo (a) que el sprint eligió —un despliegue por boda— **ya funciona sin tocar código**.

**Lo que sí se hizo**

- Verificado que fuera de `src/invitations/` ningún archivo de producción fija esta boda. Las
  apariciones de `gala-y-valentin` que quedan están en pruebas y en `supabase/local/99-verify.sql`,
  que no viajan a ningún despliegue.
- Enumerados los mandos por despliegue: 8 secretos y 2 variables, todos ya existentes.
- Añadida la sección «Desplegar una segunda boda» a
  [`CONFIGURATION_GUIDE.md`](../04-development/CONFIGURATION_GUIDE.md), con qué se copia, qué se
  cambia y el aviso de que `NARTEA_WEDDING_REGISTERED` es **por boda**, no global: una instancia
  nueva empieza en `false` para que el `INSERT` falle en rojo si el slug ya pertenece a otra.

**Si algún día se quiere un despliegue sirviendo N bodas**, el coste está medido arriba y hay que
sumarle mover la inyección de fuentes fuera del build —perdiendo la mejora del ítem 30— y la
comparación con Astro que `CIERRE_REVIEW.md` deja documentada. La decisión partiría de un número,
que era el objetivo de dejarlo escrito.

---

## Fase 8.4 — Dominio propio · absorbida por Sprint 9

> **Movida el 2026-09-04 a la fase 9.5 de [`SPRINT_9_PLAN.md`](./SPRINT_9_PLAN.md).** Depende de
> las mismas puertas externas que el resto de la puesta en producción. Los pasos se conservan abajo
> como registro; las casillas vivas están allí.


**Objetivo:** servir la invitación desde un dominio propio en vez de `*.pages.dev`.

**Bloqueada: no hay dominio.** Los pasos quedan escritos, como los siete de
[`PURGE_DEPLOYMENT.md`](../PURGE_DEPLOYMENT.md), y se ejecutan cuando exista.

- [ ] Dominio registrado
- [ ] DNS gestionado por Cloudflare, o registros apuntando al proyecto de Pages
- [ ] Dominio personalizado añadido al proyecto
- [ ] Certificado emitido y HTTPS forzado
- [ ] `SMOKE_TEST_URL` apuntando al dominio definitivo
- [ ] Revisar si el cambio de origen afecta a la configuración de Supabase Auth

**Criterio de salida:** la invitación responde por el dominio propio con certificado válido y el
smoke test pasa contra él.

### Registro de ejecución 8.4

_Sin empezar. Bloqueada por la ausencia de dominio._

---

## Fase 8.5 — Retirada de GitHub Pages

**Objetivo:** que no quede documentación afirmando algo que dejó de ser cierto. Es el barrido que
esta base de código ya ha necesitado dos veces.

- [x] Sin restos de Pages en `deploy.yml`
- [x] ADR nuevo con la decisión de hosting, sus alternativas descartadas y sus consecuencias — `ADR-021`
- [x] `ADR-012`, cuyo título es «before Pages deployment», enmendado con una nota fechada
- [x] `ARCHITECTURE.md`, `FRONTEND.md` y `README.md` describen Cloudflare — hecho en 8.1
- [x] `PRODUCT_VISION.md:45`, `SECURITY_THREAT_MODEL.md:6` y `MEDIA.md:51` — afirmaciones vivas
      localizadas durante 8.1 y aplazadas a esta fase. El modelo de amenazas es el que más importa:
      su alcance cambia, porque con cabeceras reales aparecen mitigaciones que antes eran imposibles
- [x] **No tocar** `CHANGELOG.md:133`, `ADR-005:22`, `ADR-012:8` ni `ADR-014:35`: son registros
      fechados del razonamiento en su momento, no afirmaciones vigentes
- [x] `FRONTEND.md` deja de justificar `HashRouter` por GitHub Pages: la razón cambia, la decisión
      no — hecho en 8.1
- [x] `CHANGELOG.md` y `ROADMAP.md` actualizados
- [ ] Sitio de GitHub Pages deshabilitado, una vez Cloudflare lleve tiempo estable

**Criterio de salida:** `grep -ri "github pages"` sobre `docs/`, `README.md` y los workflows no
devuelve ninguna afirmación vigente, solo registro histórico.

### Registro de ejecución 8.5

**Completada el 2026-09-04.** Solo queda deshabilitar el sitio de GitHub Pages, que es un paso de
panel y conviene hacer cuando Cloudflare lleve tiempo estable.

**`ADR-021` — Cloudflare Pages como host, con los workflows en GitHub.** Recoge la decisión, las
tres alternativas descartadas —integración Git de Cloudflare, quedarse en Pages, y aprovechar para
pasar a rutas reales— y las consecuencias. La que más importa a futuro: **`vite preview` deja de
representar a producción**, porque ignora `_headers`.

**`ADR-012` enmendado, no reescrito.** Su título dice «before Pages deployment» y su contexto habla
de GitHub Pages. Se le añadió una nota fechada que dice qué cambió y qué no: el host es otro, pero
un cliente estático sigue sin poder aplicar migraciones en runtime y el orden es el mismo. El texto
original se conserva como registro de cuándo y por qué se decidió.

**`SEC-15`, una amenaza nueva en el modelo.** No es nueva porque haya aparecido un riesgo, sino
porque ahora es mitigable. Embeber la invitación en la página de un tercero permite superponerle
contenido, y la sección de regalos publica un IBAN y un Bizum: una copia enmarcada con otro número
encima es fraude difícil de distinguir. La única defensa es `frame-ancestors`, que el navegador
ignora en un `<meta>`. **Con GitHub Pages no estaba pendiente por descuido: era inalcanzable.**
Queda registrada con esa historia, porque un modelo de amenazas que solo lista lo mitigado no
explica por qué se tardó.

**Barrido.** `PRODUCT_VISION.md`, `SECURITY_THREAT_MODEL.md` y `MEDIA.md`, localizadas durante 8.1
y aplazadas aquí a propósito. No se tocaron `CHANGELOG.md:133` ni los ADR-005, 012 y 014: recogen
el razonamiento del momento en que se decidió, y reescribirlos falsificaría la prueba.

**Criterio de salida verificado.** Un `grep -ri "github pages"` sobre `docs/`, `README.md` y los
workflows devuelve una sola línea: la nota de `SEC-15`, en pasado —«mientras el sitio se sirvió
desde GitHub Pages»—, que es uso histórico y no afirmación vigente.

---

## Convención de este documento

Cada casilla se marca **solo** cuando está verificada, no cuando está escrita. El registro de cada
fase recoge qué se hizo, qué se midió y qué apareció que no estaba previsto — incluidos los
errores propios, que en este repositorio han resultado ser la parte más útil del registro.

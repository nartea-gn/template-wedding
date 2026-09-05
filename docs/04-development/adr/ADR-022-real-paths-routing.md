# ADR-022 — Rutas reales en lugar de enrutado por fragmento

## Estado

Aceptado e implementado el 5 de septiembre de 2026. **Sustituye** la decisión de conservar
`HashRouter` que [`ADR-021`](./ADR-021-cloudflare-pages-hosting.md) registró como deuda; no
sustituye nada más de aquel documento, cuyo razonamiento sobre el host sigue vigente.

## Contexto

El enrutado por fragmento venía de GitHub Pages. Allí era la decisión correcta: un host que solo
sirve ficheros devuelve 404 ante `/rsvp`, porque ese fichero no existe, y el fragmento nunca viaja
al servidor. Sprint 8 cambió de host. `ADR-021` dejó `HashRouter` en su sitio y anotó dos motivos:
el coste de tocar los recorridos e2e, y que la decisión de no indexar «se apoya en parte en el
hash». Ninguno de los dos resistió una comprobación.

**El coste estaba mal medido.** `ADR-021` habla de 46 recorridos e2e. Los 46 son las aserciones
pgTAP de `CIERRE_REVIEW.md`. Las llamadas afectadas eran 24 `page.goto`, en cuatro ficheros, y el
cambio es mecánico.

**La indexación no se apoyaba en el hash.** `index.html` ya declara
`<meta name="robots" content="noindex, nofollow">`, y el acceso a `/admin` lo gobiernan la
autenticación y las policies RLS, no el enrutado. El argumento además se invierte: como el
fragmento no llega al servidor, con hash las tres rutas son **la misma URL** y no hay forma de
emitir `X-Robots-Tag` por ruta desde `_headers`.

**Y había un fallo activo.** El enlace de salto de `App.tsx` apunta a `#main-content`, un ancla del
documento. `HashRouter` leía ese fragmento como ruta, no la encontraba y resolvía con el comodín:
activar el primer elemento enfocable de la invitación sustituía la página por «Ruta no encontrada».
Verificado en Chromium antes del cambio. El destinatario del fallo es exactamente quien navega con
teclado o lector de pantalla, y anula el criterio 2.4.1 de la WCAG que ese enlace existe para
cumplir. Es un conflicto intrínseco: el fragmento tiene dos dueños —enrutado y anclas— y solo puede
servir a uno.

## Decisión

**`BrowserRouter` y rutas reales: `/`, `/rsvp`, `/admin`.**

**`<main id="main-content">` recibe `tabIndex={-1}`.** Un ancla mueve el foco solo si su destino es
enfocable; sin esto el enlace de salto desplazaría la vista sin llevar el foco, que es la mitad que
le importa a un lector de pantalla.

**No se configura ninguna regla de reescritura, y es deliberado.** Cloudflare Pages ya sirve
`index.html` con `200` ante una ruta que no corresponde a ningún fichero, mientras el proyecto no
publique un `404.html`; `vite dev` hace lo mismo. Intentar declararlo explícitamente resultó ser
peor que no hacerlo, medido contra `wrangler pages dev`:

| Regla en `_redirects` | Resultado medido |
|---|---|
| ninguna | `/rsvp`, `/admin` y cualquier ruta inventada devuelven `200` con `index.html` |
| `/*  /index.html  200` | Wrangler la declara bucle infinito y **la ignora**. No aporta nada |
| `/rsvp  /index.html  200` | **`308` a `/`**. Un `/rsvp` guardado en marcadores acaba en la landing |

La tercera fila es el motivo real: nombrar la ruta rompe el enlace profundo que pretendía arreglar.
Pages redirige `/index.html` a `/`, y una regla que apunta ahí hereda esa redirección.

**La red que lo sostiene es el smoke test.** `pnpm smoke:test` pide `/` , `/rsvp` y `/admin` contra
el despliegue y exige `200` en las tres. Bajo enrutado por fragmento ese bucle no podía fallar:
las tres eran la misma petición. Ahora es la única comprobación de que el fallback del host sigue
existiendo — publicar un `404.html` lo desactivaría en silencio.

## Alternativas descartadas

**Conservar el hash y parchear el enlace de salto** interceptando el `click` y moviendo el foco por
código. Funciona, pero es código que existe solo para compensar el enrutado y que se tira el día
que se migre. Se descarta porque la migración ya estaba decidida como deuda: solo faltaba pagarla.

**Esperar al primer despliegue de la fase 9.2.** Era el orden que sugería `ADR-021` —no correr dos
riesgos a la vez— y presupone un sitio en producción al que romper. No lo hay: el primer despliegue
no ha ocurrido. Hacerlo antes es más barato y no arriesga nada publicado.

## Consecuencias

- **Los enlaces profundos dependen del host**, no del repositorio. Está documentado en el propio
  `AppRouter` y en `README.md`, y verificado por `pnpm smoke:test`.
- **El fragmento vuelve a ser del documento.** Las anclas funcionan, y con ellas el enlace de salto.
  `e2e/app.spec.ts` fija foco y contenido; ese test sobrevive a cualquier enrutado futuro.
- **Las URLs pierden el `#/`.** Cualquier enlace compartido durante el desarrollo deja de resolver;
  como no hay despliegue previo, no hay marcadores de invitados que romper.
- **Se puede emitir `X-Robots-Tag` por ruta** desde `_headers` si algún día se quiere reforzar el
  `noindex` con algo que el crawler no pueda ignorar. No se hace ahora.
- **`vite dev` deja de ser representativo en un punto más**: resuelve el fallback por su cuenta, así
  que un fallo del host no aparecería hasta el smoke test.

## Señales que activan una revisión

- publicar un `404.html`, que desactiva el fallback de Pages y obliga a resolver el enrutado de otra
  forma;
- cambiar de host a uno sin fallback ni reescrituras, que devolvería el problema original;
- servir varias bodas desde un único despliegue, que convierte el prefijo de ruta en parte del
  contrato y no solo en una vista.

## Fuentes

- [Cloudflare Pages: `_redirects`](https://developers.cloudflare.com/pages/configuration/redirects/)
- [WCAG 2.4.1 Bypass Blocks](https://www.w3.org/WAI/WCAG22/Understanding/bypass-blocks.html)

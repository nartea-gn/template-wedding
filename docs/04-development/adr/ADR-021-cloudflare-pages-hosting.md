# ADR-021 — Cloudflare Pages como host, con los workflows en GitHub

## Estado

Aceptado. Implementado en Sprint 8, fases 8.1 y 8.2. Sustituye a GitHub Pages como host estático;
no sustituye a `ADR-012`, cuyo razonamiento sobre migraciones sigue vigente.

## Contexto

GitHub Pages sirve archivos y nada más. No permite añadir cabeceras de respuesta, y esa limitación
no era teórica: dejaba fuera `frame-ancestors`, que el navegador **ignora** cuando llega en un
`<meta>`. La invitación publica un IBAN y un número de Bizum en su sección de regalos, así que
poder envolverla en la página de otro es un riesgo concreto —`SEC-15`— que no estaba pendiente por
descuido, sino que era inalcanzable con ese host.

A eso se sumaban tres motivos menores: el sitio vivía en un subpath (`/template-wedding/`) en vez
de en la raíz; no había forma barata de dar un dominio propio a cada boda; y la organización
prefiere concentrar la infraestructura.

## Decisión

**Cloudflare Pages es el host. Los workflows se quedan en GitHub.**

`deploy.yml` levanta un Postgres desechable para verificar las migraciones, comprueba que
`schema.sql` no ha derivado, ejecuta los recorridos e2e, aplica migraciones contra Supabase y
despliega la Edge Function. Cloudflare no puede hacer nada de eso. Recibe la carpeta construida y
la sirve; la publicación es el último paso del pipeline, con `cloudflare/wrangler-action`.

Consecuencias directas de la decisión:

- `base` pasa a la raíz del sitio.
- La Content-Security-Policy deja el `<meta>` y se emite en `_headers`, generado por el build
  porque el origen de Supabase es una variable de compilación. Gana `frame-ancestors 'none'`.
- Se añaden `Strict-Transport-Security`, `X-Content-Type-Options`, `Referrer-Policy`,
  `Permissions-Policy` y caché inmutable para `/assets/*`.
- `HashRouter` **se conserva**. El host ya permitiría rutas reales con `_redirects`; el motivo para
  no cambiarlas ahora es el coste, no la plataforma. **Revertido el 5 de septiembre de 2026 por
  [`ADR-022`](./ADR-022-real-paths-routing.md)**: los dos motivos que sostenían la espera resultaron
  falsos —el coste estaba mal medido y la decisión de no indexar no se apoyaba en el hash— y el
  fragmento estaba rompiendo el enlace de salto. La reescritura con `_redirects` que esta línea da
  por buena tampoco funciona; el ADR-022 recoge lo medido.

## Alternativas descartadas

**Integración Git de Cloudflare**, donde Cloudflare clona el repositorio y construye. Es más simple
de configurar y regala despliegues de vista previa por Pull Request, pero pierde todas las puertas
de calidad: no puede levantar Postgres ni aplicar migraciones. Habría que moverlas a otro workflow
y coordinarlas con un despliegue que no controlamos. Para este repositorio es un retroceso.

**Quedarse en GitHub Pages y aceptar la CSP en `<meta>`.** Es la opción de coste cero, y deja
`SEC-15` abierto de forma permanente. Se descarta por eso, no por las comodidades.

**Aprovechar para pasar a rutas reales.** Cloudflare lo permite con `_redirects`, pero tocaría los
46 recorridos e2e y obligaría a revisar la decisión de no indexar, que hoy se apoya en parte en el
hash. Se pospone: la migración de host y el cambio de enrutado son dos riesgos que no conviene
correr a la vez.

> Los tres datos de este párrafo eran incorrectos y [`ADR-022`](./ADR-022-real-paths-routing.md) los
> corrige: eran 24 llamadas y no 46 recorridos, el `noindex` vive en un `<meta>` y no en el hash, y
> el enrutado no necesita `_redirects` en Pages. El argumento del riesgo compartido presuponía
> además un sitio en producción, que no existía.

## Consecuencias

- **`vite preview` deja de representar a producción.** Ignora `_headers`, así que una página
  servida con él no lleva política. Por eso el recorrido de CSP corre contra `wrangler pages dev`,
  y por eso `wrangler` es dependencia de desarrollo. Quien lo olvide verá el test fallar, que es lo
  que debe pasar.
- **La política tiene una sola fuente de verdad**, el generador de `_headers`. No hay `<meta>` que
  pueda quedar desincronizado.
- **El rollback cambia de forma**: ya no es volver a desplegar, sino promover un despliegue
  anterior. Es más rápido y hay que documentarlo así en `7.5B`.
- Aparecen tres mandos nuevos por despliegue: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID` y
  `CLOUDFLARE_PAGES_PROJECT`.
- Cloudflare envía `Referrer-Policy` y `X-Content-Type-Options` por defecto. Se declaran igualmente:
  un contrato de seguridad no debería descansar sobre un valor por defecto que no controlamos.

## Señales que activan una revisión

- necesidad de lógica en servidor, que abriría la puerta a Pages Functions y a replantear qué corre
  dónde;
- límites, coste o política de Cloudflare que afecten al proyecto;
- decisión de servir varias bodas desde un único despliegue, que reabre además la comparación con
  Astro registrada en [`CIERRE_REVIEW.md`](../../CIERRE_REVIEW.md);
- ~~decisión de pasar a rutas reales, que solo depende de aceptar su coste~~ — tomada en
  [`ADR-022`](./ADR-022-real-paths-routing.md).

## Fuentes

- [Cloudflare Pages: `_headers`](https://developers.cloudflare.com/pages/configuration/headers/)
- [MDN: CSP `frame-ancestors`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/frame-ancestors)

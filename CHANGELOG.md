# Changelog

Este archivo registra hitos consolidados. El detalle de trabajo futuro pertenece al roadmap y al backlog.

## Unreleased

### La sección «Nuestra historia» desaparece del producto

- `story` deja de existir como tipo de sección. Se retiran la instancia en `invitation.ts` y sus
  claves `story.*` en los tres catálogos (`es`, `en`, `bg`), el componente `StorySection`, su
  entrada en `weddingSectionRegistry`, el tipo `StorySection` y su miembro en `InvitationSection`,
  el export público de `core/invitation`, la rama de validación y las cinco reglas
  `.landing-story*` de `Landing.css`.
- No es una desactivación: una invitación que declare `type: 'story'` ya no compila. Recuperar la
  sección exige revertir este cambio, no cambiar una bandera.
- `validation.test.ts` pierde los dos casos que cubrían la rama borrada.
- `ADR-023` registra el porqué y sustituye la mitad `story` de `ADR-019`, que queda anotado y sin
  editar en lo demás: su mitad de alojamiento sigue vigente. `CONFIGURATION_GUIDE.md` deja de
  ofrecer `story` como tipo declarable y `PRODUCT_BACKLOG.md` la devuelve a contenido aplazado.

### Rutas reales en vez de enrutado por fragmento

- La invitación se sirve en `/`, `/rsvp` y `/admin`. `HashRouter` desaparece; lo sustituye
  `BrowserRouter`. La decisión y lo medido están en `ADR-022`, que revierte la línea de `ADR-021`
  que conservaba el hash.
- **El enlace de salto vuelve a funcionar.** Apunta a `#main-content` y el router leía ese fragmento
  como ruta: activarlo —el primer elemento enfocable de la página— sustituía la invitación por «Ruta
  no encontrada», justo para quien navega con teclado o lector de pantalla. `<main>` recibe además
  `tabIndex={-1}`, sin el cual un ancla desplaza la vista pero no mueve el foco.
- No se configura ninguna reescritura, y está medido por qué: Cloudflare Pages ya sirve `index.html`
  con `200` ante una ruta que no es un fichero, `/*  /index.html  200` se descarta como bucle y una
  regla por ruta devuelve un `308` a `/` que rompería el enlace profundo.
- `pnpm smoke:test` pide `/rsvp` y `/admin` como peticiones distintas. Bajo el hash las tres rutas
  eran la misma URL y ese bucle no podía fallar; ahora es lo que detecta que el fallback del host
  desaparezca.
- `e2e/app.spec.ts` fija el enlace de salto —foco y contenido—, un test que sobrevive a cualquier
  enrutado posterior.

### Las extensiones de base de datos dejan de ser un paso manual

- `20260711_enable_extensions.sql` crea `pg_cron` y `pg_net` antes que ninguna otra migración. Una
  base vacía —`supabase start`, `supabase db reset`, un proyecto nuevo— fallaba en `20260901` con
  `schema "cron" does not exist`, porque las extensiones solo existían en el harness local y como
  paso de dashboard en el runbook.
- El harness deja de crearlas: `supabase/local/00-shims.sql` se queda con pgTAP y los dos secretos
  de Vault de mentira. Así verifica el mismo arranque que recibe un proyecto real en vez de tapar
  el que faltaba.
- `PURGE_DEPLOYMENT.md` y la fase 9.1 cambian de «activar las extensiones» a «comprobar que el rol
  del workflow puede crearlas»; si no puede, el camino manual sigue escrito.
- Verificado con `pnpm db:verify`: 11 migraciones aplicadas en orden, la nueva la primera, más las
  aserciones de esquema y las suites pgTAP por rol.

### Una instalación limpia vuelve a funcionar

- `package.json` declara `pnpm.onlyBuiltDependencies` con `esbuild` y `workerd`. pnpm 10 no ejecuta
  los scripts de instalación de las dependencias salvo que se nombren, y esos dos los necesitan para
  colocar su binario de plataforma: sin ellos no hay `vite build` ni `wrangler pages dev`.
- El lockfile registraba `wrangler` como `^4.129.0` mientras el manifiesto pide `4.129.0` exacto.
  `pnpm install --frozen-lockfile` —lo que corren los dos workflows, y el modo por defecto en CI—
  fallaba con `ERR_PNPM_OUTDATED_LOCKFILE` antes de instalar nada. Ninguno de los dos gates había
  llegado a ejecutarse nunca, así que nadie lo había visto.

### Corrección en la matriz de navegadores

- `playwright.config.ts` excluía `csp.spec.ts` una sola vez, en la raíz, y los cuatro proyectos de
  compatibilidad la anulaban con su propio `testIgnore`: un `testIgnore` de proyecto sustituye al de
  la configuración en vez de sumarse. `pnpm test:e2e:matrix:compat` recogía la suite de CSP contra
  `pnpm dev`, que no sirve cabeceras, y fallaba en su primera aserción. La matriz de compatibilidad
  pasa de 60 casos recogidos a 40, los que realmente le tocan.

### Migración de hosting a Cloudflare Pages — Sprint 8

- La invitación se sirve desde Cloudflare Pages, en la raíz del sitio en vez de en un subpath. Los
  workflows siguen en GitHub: Cloudflare recibe la carpeta construida y no compila nada, así que
  ninguna puerta de calidad del pipeline se pierde.
- La Content-Security-Policy deja el `<meta>` y viaja como cabecera desde `_headers`, generado por
  el build. Gana **`frame-ancestors 'none'`**, la directiva que un `<meta>` no puede llevar y que
  cierra `SEC-15`: la invitación publica un IBAN y ya no puede envolverse en la página de otro.
- Se añaden `Strict-Transport-Security`, `X-Content-Type-Options`, `Referrer-Policy`,
  `Permissions-Policy` y caché inmutable para los recursos con hash.
- `e2e/csp.spec.ts` corre contra `wrangler pages dev`, el único servidor local que aplica
  `_headers`, y comprueba que la invitación se niega a renderizarse dentro de un frame.
- `pnpm smoke:test` lee la cabecera de respuesta en vez del `<meta>` y falla si el framing deja de
  estar denegado.
- `HashRouter` se conserva. El host ya permitiría rutas reales; no cambiarlas ahora es una decisión
  de coste, no una limitación.

### Deuda de código no bloqueada — Sprint 7.5A

- Los catálogos dejan de heredarse por spread: `bg.ts` declara sus claves y la cadena de fallback se declara en la
  invitación (`{bg: "en", en: "es"}`). Una traducción olvidada ya no se sirve en inglés, falla en las pruebas.
- El panel pregunta antes de borrar, nombrando al invitado, y aclara que la respuesta se puede restaurar hasta la purga.
- `admin_audit` registra qué administrador editó, borró o restauró cada respuesta, y los cambios de plazo. Lo escriben
  triggers que leen `auth.uid()`, no el navegador, y ninguna política permite modificarlo.
- El rastro de auditoría **no guarda contenido del invitado** y se borra en cascada con la respuesta: la purga de los
  siete días se lo lleva, como exige el aviso del artículo 13.
- La tabla de respuestas se apila por debajo de 768 px, con la etiqueta de cada columna junto a su valor y los roles de
  tabla declarados, porque `display: block` elimina la semántica implícita.
- `pnpm run test:e2e:csp` ejecuta un navegador contra el build y falla si la Content-Security-Policy bloquea algo o
  desaparece. Con esa red, la política pierde `'unsafe-inline'` en `style-src`.
- El contraste de alineación del countdown deja de medirse en dos viajes al navegador, que producían falsos positivos
  cuando el layout se desplazaba entre ambos.

### Cierre de deuda de código — Sprint 7.4C

- Ocho claves `admin.actions.*` existían solo en el catálogo español: un administrador en inglés o búlgaro veía los
  botones de editar, guardar, borrar y restaurar en español. Añadidas a `en.ts` y `bg.ts`.
- `locales/catalogs.test.ts` exige paridad de claves entre los tres catálogos en ambos sentidos, y que ningún valor
  búlgaro coincida con su original inglés fuera de una allowlist justificada. Ni TypeScript ni el aviso de DEV podían
  detectar ese hueco.
- `gsap`, `impeccable` y `taste-skill` salen del manifiesto: eran dependencias de runtime sin un solo import, y una
  arrastraba Puppeteer. `node_modules` baja de 449 MB a 400 MB.
- El build emite una Content-Security-Policy cuyo `connect-src` nombra el origen de Supabase, que solo se conoce al
  compilar. `pnpm build` falla si falta `VITE_SUPABASE_URL`; `dev` y `preview` no la exigen.
- `pnpm smoke:test` verifica contra el despliegue que esa política existe y autoriza un origen de Supabase.
- Los errores de consola pasan por `lib/devLog.ts` y no llegan a producción. Los de Admin registraban el `cause` de
  operaciones sobre respuestas RSVP, que arrastra datos de invitados.
- La matriz de temas de Playwright añade 320 × 568 px, el breakpoint que el backlog exige «con todos los temas» y que
  esa matriz nunca cubrió.
- `supabase/functions-check/` comprueba los tipos de las Edge Functions con `deno check` en un contenedor, sin instalar
  Deno en el host. Era el único código de producción que no leía ningún compilador.

### Autenticación Admin configurable

- Cada invitación selecciona OTP o email y contraseña mediante `admin.auth.method`.
- Ambos métodos autentican con Supabase y conservan la autorización por `invitation_admins` y RLS.
- Un comando Node idempotente provisiona emails y membresías desde variables privadas para local o producción explícita.
- La configuración pública no contiene contraseñas, emails operativos ni claves privilegiadas.

### QA de release — Sprint 7.4

- El selector móvil de mapas respeta el viewport dinámico y las áreas seguras del dispositivo.
- Las opciones automática, Google Maps y Apple Maps permanecen completamente visibles en 320 × 568, 360 × 740 y
  390 × 844 px, sin alterar el popover de escritorio.
- Playwright cubre el encaje vertical de las tres opciones en un viewport móvil compacto.
- La concurrencia local de Playwright queda limitada a dos workers para que el comando oficial sea estable y
  reproducible en el entorno de desarrollo.
- Una matriz manual estable ejecuta 59 recorridos en dos fases sobre Chromium, Firefox, WebKit, Pixel 5 e iPhone 13
  emulados; los smoke tests responsive cubren 320, 390, 768 y 1440 px.
- El selector de idioma completa el patrón de menú con foco inicial, flechas, Inicio/Fin, Escape y retorno al trigger;
  el selector de mapas queda cubierto por el mismo contrato de foco y cierre.
- ES, EN y BG mantienen idioma, SEO, contenido localizado y countdown; una invitación monolingüe oculta su selector.
- Royal, Boho, Dark, Magnolia y Linen recorren Landing, RSVP y acceso Admin en móvil y escritorio sin overflow.
- El uso de `primary` como texto pequeño en Boho y Magnolia queda registrado como decisión visual pendiente, sin alterar
  las paletas aprobadas durante QA.

### Contratos runtime completos — Sprint 7.3

- `event.date` unifica hero y countdown mediante un instante ISO 8601 con offset explícito.
- `rsvp.deadline` gobierna CTA, ruta y comprobación previa al envío sin ocultar Admin.
- CTA y rutas reflejan el cierre al alcanzar el deadline aunque la página permanezca abierta.
- SEO localizado actualiza título, metadescripción e idioma activo.
- Validación estructural cubre fechas, timezone, orden temporal, IDs, estados vacíos y límites de formulario.
- Los E2E fijan el reloj para permanecer reproducibles después de la fecha de la invitación de referencia.

### Quality gates automatizados — Sprint 7.2

- Vitest y React Testing Library cubren configuración, localización, Form Engine, mappers, Repository, rutas opcionales
  y estados de Admin.
- Playwright valida Landing, RSVP afirmativo y negativo, error recuperable y acceso protegido de Admin en Chromium.
- pgTAP verifica estructura, privilegios, RLS y aislamiento entre invitaciones sobre Supabase local.
- El workflow de Pull Request separa gates de aplicación y base de datos, fija las versiones de herramientas y conserva
  el informe Playwright como artefacto de diagnóstico.

### Seguridad de RSVP y acceso Admin — Sprint 7.1

- Lectura RSVP aislada mediante RLS por usuario e invitación; `anon` conserva exclusivamente la inserción pública
  necesaria.
- Baseline reproducible y migración incremental verificadas en instalaciones locales limpias y existentes.
- Acceso Admin sustituido por email OTP de seis dígitos, sesión Supabase y cierre de sesión real.
- Provisionamiento y revocación manual documentados, sin secretos privilegiados ni contraseñas dentro del bundle.
- Flujo Admin validado en escritorio y móvil, incluida restauración, logout y respuesta neutra para correos
  desconocidos.

### Theme Engine v2 y baseline visual — Sprints 6.4–6.6

- Theme Engine v2 con contratos de composición, motion, superficies, decoración e iconografía para cinco temas.
- Preservación explícita de la identidad tipográfica histórica de Royal.
- Alineación de anillos y unidades del countdown en resoluciones estrechas.
- Roles cromáticos semánticos y contraste estático AA para Royal, Boho, Dark, Magnolia y Linen.
- Fondos artísticos modulares y responsive en Landing, RSVP y éxito, sin estiramientos ni costuras visibles.
- Royal restaurado y aprobado como baseline; comparativa de las cinco colecciones completada en móvil y escritorio.
- Superficies funcionales de RSVP protegidas y Admin conservado como experiencia operativa.
- Documentación de producto, configuración, arquitectura, auditorías y release alineada con el runtime actual.
- `pnpm lint` y `pnpm build` confirmados por producto sobre el trabajo integrado en PR #17.

### Limitaciones conocidas antes de 1.0.0

- La matriz exhaustiva de Firefox, WebKit, móvil y dispositivos físicos pertenece a Sprint 7.4.

## Hitos consolidados

### Experiencia premium y responsive — Sprints 6.0–6.3

- Una única superficie visual para RSVP y mejoras de accesibilidad del Form Engine.
- Selector de idioma compacto y estable en todos los breakpoints.
- Iconografía SVG propia, alianzas del countdown y motion compatible con `prefers-reduced-motion`.
- Vídeo bajo demanda con poster WebP y procedimiento reproducible de optimización.
- Selector adaptativo de proveedores de mapas compatible con Android, iOS y escritorio.
- Refinamiento responsive de Landing, RSVP y Admin.

### Admin opcional — Sprints 5.0–5.1 A

- Ruta y bundle condicionales.
- Métricas configurables, tabla dinámica y compatibilidad con respuestas legacy.
- Búsqueda, filtros, ordenación, paginación y selector de filas.
- Exportación CSV del conjunto presentado y fecha de última actualización.

### Form Engine y persistencia — Sprints 4.0–4.1

- Formulario RSVP declarativo, versionado y localizado.
- Repository Pattern y adaptador Supabase desacoplado de React.
- Respuestas dinámicas almacenadas como JSONB con mapper centralizado.
- Pipeline de migraciones previo al despliegue de GitHub Pages.

### Motor configurable — Sprints 2.0–3.0

- `InvitationDefinition` como contrato principal.
- Localización Core con español, inglés y búlgaro, carga diferida y selector opcional.
- Section Registry tipado y orden de secciones gobernado por configuración.
- Rutas y capabilities opcionales.

### Fundamentos — Sprints 0–1

- Visión de producto, principios, ADR y arquitectura incremental.
- Design Tokens TypeScript y temas centralizados.
- React 19, React Router 7, TypeScript 7, Vite 8 y Tailwind CSS 4.

# Guía de configuración de una invitación

Esta guía describe cómo crear una variante de invitación sin modificar el Core. La boda actual se encuentra en
`src/invitations/wedding` y sirve como implementación de referencia.

## 1. Preparar el entorno

```powershell
pnpm install --frozen-lockfile
Copy-Item .env.example .env
pnpm dev
```

Completa `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`. No incluyas service-role keys ni otros secretos privilegiados
en variables `VITE_*`: Vite las incorpora al bundle público.

`VITE_SUPABASE_URL` es **obligatoria para construir**: `pnpm build` falla en rojo sin ella. El build emite la
Content-Security-Policy de la página y su `connect-src` tiene que nombrar el origen de la API a la que llama la
aplicación, un dato que solo se conoce al compilar. `pnpm dev` y `pnpm preview` no la exigen, porque no emiten esa
cabecera. Cambiar de proyecto Supabase obliga a reconstruir: un `dist/` heredado lleva el origen anterior en su
política y bloquea las llamadas al nuevo.

Admin usa usuarios provisionados en Supabase Auth y el método declarado por invitación; consulta el runbook de
seguridad antes de desplegar.

### La pareja

Los nombres no se escriben en los catálogos: cada idioma declara su gramática alrededor de huecos
`{partnerOne}`, `{partnerTwo}`, `{surnameOne}` y `{surnameTwo}`, y los valores llegan de una vez desde
el entorno. `src/invitations/wedding/locales/variables.ts` los sustituye **al cargar cada catálogo**,
no en cada `t()`, así que el runtime de localización no conoce esta boda.

| Variable | Obligatoria | Para qué |
|---|---|---|
| `VITE_PARTNER_ONE` · `VITE_PARTNER_TWO` | No | Nombres de pila. Sin ellos se renderizan los de la plantilla |
| `VITE_SURNAME_ONE` · `VITE_SURNAME_TWO` | No | Apellidos. **Sin ellos no se escribe nada**, ni el espacio que ocupaban |
| `VITE_PARTNER_ONE_BG` · `VITE_PARTNER_TWO_BG` · `VITE_SURNAME_ONE_BG` · `VITE_SURNAME_TWO_BG` | No | Grafía de los idiomas que transliteran. Si falta, se usa la base |

Ninguna lanza si falta: sin nombre hay una demo que renderizar, a diferencia de
`VITE_SUPABASE_URL`. Eso es también lo que mantiene verdes CI, los e2e y un `pnpm dev` recién clonado.

Los apellidos son condicionales de verdad. `gifts.account.holder` lee `Gala García y Valentin Petrov`
con ambos declarados y `Gala y Valentin` sin ninguno: el hueco se lleva el espacio que tenía delante,
porque después ningún `trim` podría distinguirlo de un espacio que el idioma sí quería.

Un idioma que translitera y no declara su override muestra la grafía base, mezclando alfabetos
(`Ана Ruiz и Бруно`). Es el comportamiento buscado —una grafía es mejor que un hueco—, pero declara
los `_BG` si publicas apellidos.

`catalogs.test.ts` falla si un catálogo vuelve a llevar un nombre escrito a mano. Es la prueba que
impide que esto se deshaga solo.

#### El hashtag

No tiene variable propia: se deriva de los nombres, así que ponerlos ya lo actualiza. Es una clave de
catálogo, `event.hashtag`, y de ella **solo se traduce la palabra**:

| Idioma | Clave | Resultado sin variables |
|---|---|---|
| es | `#Boda{partnerOneBase}Y{partnerTwoBase}` | `#BodaGalaYValentin` |
| en | `#Wedding{partnerOneBase}Y{partnerTwoBase}` | `#WeddingGalaYValentin` |
| bg | `#Wedding{partnerOneBase}Y{partnerTwoBase}` | `#WeddingGalaYValentin` |

Dos detalles deliberados:

- Los nombres usan `{partnerOneBase}`, no `{partnerOne}`: los huecos «base» **se saltan el override
  por idioma**. Un tag tiene que poder escribirse desde cualquier teclado y buscarse como una sola
  cadena, así que no se bifurca por alfabeto como sí hace la prosa.
- El búlgaro hereda la palabra inglesa en vez de traducirla a `#Сватба…`, por lo mismo.
- El conector se queda en `Y` en los tres. Solo la palabra se traduce.

Aun así, **dos tags no son uno**: quien publique en español y quien publique en inglés caen en muros
distintos. Es la contrapartida aceptada de traducir la palabra; si algún día pesa más la agregación,
la vuelta atrás es que los tres catálogos declaren la misma cadena.

**Fuera del alcance del entorno:** el `id` de la invitación (`gala-y-valentin`) sigue nombrando a la
pareja, porque es el `wedding_slug` con el que están guardadas las respuestas: cambiarlo es una
migración de datos, no un renombrado.

## 2. Definir una identidad única

Edita `src/invitations/wedding/invitation.ts`:

```ts
id: 'identificador-unico-del-evento'
```

El ID identifica las respuestas persistidas y debe permanecer estable durante la vida de la invitación. Cambiarlo en una
invitación desplegada separa el frontend de sus respuestas anteriores.

Configura también `event.type`, `event.date`, `event.timezone` y las claves localizadas de título/SEO. `event.date` es
un instante ISO 8601 con offset explícito y alimenta tanto la fecha visible como el countdown:

```ts
event: {
    date: '2027-06-12T12:00:00+02:00',
        timezone
:
    'Europe/Madrid',
}
```

Evita fechas ambiguas como `2027-06-12`. `seo.title` y `seo.description` se resuelven desde el locale activo y actualizan
los metadatos del documento.

Declara además el responsable del tratamiento. Es obligatorio y la invitación no compila sin él: el artículo 13 del
RGPD exige que el invitado sepa quién trata sus datos y cómo contactarle, y el responsable es **la pareja**, no la
agencia. El aviso del formulario RSVP se compone con estos dos valores.

```ts
controller: {
    name: 'controller.name',   // clave de catálogo, se traduce
        email
:
    'pareja@ejemplo.com',
}
```

## 3. Elegir un tema

Los IDs válidos se derivan del registro en `src/design/themes/themes.ts`. El tema fijado aquí decide también qué
familias tipográficas pide el HTML: el build inyecta solo las de este tema, así que cambiarlo no deja fuentes de otro
colgando.

```ts
theme: {id: 'royal'}
```

Temas actuales: `royal`, `boho`, `dark`, `magnolia`, `linen`, `lavender` y `terracotta`.

Para añadir uno:

1. Añade una definición completa a `themes`.
2. Define colores y variantes RGB, tipografía, sombras, radios, composición, motion, superficies, decoración e
   iconografía.
3. No añadas contenido, components, callbacks o capabilities.
4. Comprueba Landing, RSVP y Admin en 320, 390, 768 y 1440 px.
5. Compara Royal con la referencia desplegada si has tocado consumidores compartidos.

Consulta `docs/02-design/THEMES.md` y ADR-013.

## 4. Configurar idiomas

El idioma predeterminado es español. El contrato vive en el Core y se aplica a todas las invitaciones:

```ts
localization: {
    defaultLocale: 'es',
        supportedLocales
:
    ['es', 'en', 'bg'],
        selector
:
    {
        visible: true
    }
,
}
```

### Invitación monolingüe

```ts
supportedLocales: ['es'],
    selector
:
{
    visible: false
}
,
```

Con un único locale no se renderiza selector aunque `visible` se configure por error.

### Añadir un locale

1. Añade el código a `src/invitations/wedding/locales/types.ts`.
2. Crea un catálogo con las mismas claves que `es.ts`.
3. Registra su import dinámico en `locales/loaders.ts`; el catálogo por defecto se importa de forma estática.
4. Añádelo a `supportedLocales`.
5. Añade sus aserciones a `locales/catalogs.test.ts`.
6. Verifica textos largos, errores, fechas, Admin y formulario.

El paso 2 no es una recomendación: `catalogs.test.ts` exige paridad exacta de claves entre los tres catálogos, en
ambos sentidos. Sin esa red, una clave que solo existe en `es.ts` no rompe nada visible —`t()` cae al catálogo por
defecto— y el invitado que eligió otro idioma lee español. Así se publicaron ocho claves del panel.

`bg.ts` es además un caso especial: se construye con el spread de `en.ts`, de modo que olvidar una traducción compila
sin error y produce una cadena en inglés, no un hueco. El test lo detecta comparando cada valor búlgaro con su
original inglés. Las coincidencias legítimas —marcas, símbolos de precio, endónimos y el dominio de ejemplo de la
RFC 2606— viven en la allowlist del propio test; añadir una exige justificarla ahí.

No se detecta automáticamente el navegador. La resolución es: locale permitido explícito, preferencia persistida y
`defaultLocale`.

## 5. Configurar secciones

El array `sections` gobierna orden y visibilidad. Cada entrada necesita ID único, tipo registrado, `enabled` y contenido
con claves localizadas.

Tipos actuales:

- `hero`;
- `countdown`;
- `video`;
- `venue`;
- `lodging`;
- `gifts`;
- `rsvp-cta`. El tipo se puede declarar **más de una vez** —con ids distintos, que
  `validateInvitationDefinition` exige— y entonces solo la instancia con `closing: true` muestra el hashtag, porque
  repetirlo en cada llamada sería ruido. Esta invitación declara **una sola**, la del cierre.
  `deadlineNotice` es opcional y lleva un hueco `{date}` que se rellena con el plazo que de verdad gobierna el
  cierre —el de la base de datos si ha respondido, el compilado si no—, así que mover el plazo desde el panel mueve
  la fecha que lee el invitado sin redesplegar. Solo se pinta con el RSVP abierto.

Desactivar una sección no requiere tocar Landing:

```ts
{
    id: 'video',
    type: 'video',
    enabled: false,
    content: { /* contrato completo */ },
}
```

Una invitación que no ofrece alojamiento o regalos simplemente no declara esa entrada; no hay estado vacío
que mantener dentro de los componentes.

### Regalos

`account` publica el IBAN; `account.bizum` publica teléfonos, y por eso lleva interruptor propio: una invitación
puede ofrecer la cuenta sin exponer el móvil de nadie.

```ts
account: {
    iban: 'ES00 0000 0000 0000 0000 0000',
    holderKey: 'gifts.account.holder',
    bizum: {
        enabled: true,
        labelKey: 'gifts.account.bizum',
        numbers: [
            { labelKey: 'hero.partnerOne', value: '+34 600 000 000' },
            { labelKey: 'hero.partnerTwo', value: '+34 611 000 000' },
        ],
    },
    revealOnRequest: true,
    revealLabel: 'gifts.account.reveal',
    ibanLabel: 'gifts.account.iban',
    copyLabel: 'gifts.account.copy',
    copiedLabel: 'gifts.account.copied',
}
```

- **Como máximo dos números**, y al menos uno cuando `enabled` es `true`. Lo aplica
  `validateInvitationDefinition`, no la convención.
- Cada número lleva su propio `labelKey`. Apúntalo a la clave que ya tiene el nombre —`hero.partnerOne`— y un
  renombrado viaja solo en vez de perseguirse por dos sitios y traducirse dos veces.
- El `labelKey` del grupo nombra el bloque una vez. Sin él las filas serían dos teléfonos sueltos con un nombre
  delante, y el invitado no sabría por dónde está pagando.
- **El aviso de fraude (`fraudWarningKey`) se renderiza con los números, no con el bloque de cuenta.** El fraude que
  corta es el del cambio de teléfono, así que una invitación que solo publica IBAN no muestra aviso, y una que apaga
  Bizum se lleva los números y el aviso juntos. Aparece cuando el invitado ya tiene los números delante, no antes de
  pulsar «Ver el número de cuenta».

Para un tipo nuevo, define el contrato Core, implementa la Feature y regístrala en
`src/invitations/wedding/sectionRegistry.tsx`. No añadas lógica de boda al renderer genérico. `SectionRegistry` es un
mapped type sobre el discriminante de la unión: olvidar el renderer de una sección nueva, o cruzar dos, no compila.

Ver [`ADR-019`](./adr/ADR-019-lodging-and-story-sections.md) para las decisiones de contrato de `lodging`. La
sección `story` que aquel documento también introdujo se retiró del motor; el porqué está en
[`ADR-023`](./adr/ADR-023-remove-story-section.md).

## 6. Registrar medios

Los componentes reciben IDs, no imports de activos desde la configuración:

1. Importa el archivo en `src/invitations/wedding/assets.ts`.
2. Regístralo con un ID estable.
3. Referencia ese ID desde la sección.

```ts
content: {
    assetId: 'wedding-hero-video',
        posterAssetId
:
    'wedding-hero-video-poster',
        preload
:
    'none',
        aspectRatio
:
    '9 / 16',
}
```

Sigue `MEDIA_WORKFLOW.md` para comprimir el vídeo, crear el poster y validar `faststart`.

## 7. Configurar ubicaciones y mapas

Cada venue puede incluir `time`, clave localizada de dirección y una consulta estable:

```ts
{
    id: 'ceremony',
        typeLabel
:
    'venue.ceremony.type',
        name
:
    'venue.ceremony.name',
        time
:
    '12:00',
        mapsQuery
:
    'C. del Nuncio, 14, Centro, 28005 Madrid',
}
```

**`address` y `mapsQuery` son mutuamente excluyentes, y la validación rechaza un item que declare los dos.** Eran dos
cadenas independientes para un mismo sitio, libres de separarse sin que nada lo detectara: la tarjeta de la ceremonia
llegó a mostrar «Calle Mayor, 1, Madrid» mientras «Cómo llegar» abría «C. del Nuncio, 14», y ninguna comprobación puede
compararlas por significado.

Usa `mapsQuery` para un lugar con dirección navegable: es precisa y **no depende del idioma**, que es lo que debe ser el
nombre de una calle —el catálogo búlgaro transliteraba la calle como «Кале Майор 1, Мадрид», que se lee bien y no
navega a ninguna parte—. La tarjeta muestra esa misma cadena. Reserva `address` para un sitio sin dirección navegable
(«en casa de los abuelos»), que es también el caso en el que no debe aparecer botón de mapa.

`mapProviders` decide si se ofrecen mapa del dispositivo, Google Maps y Apple Maps. Comprueba siempre Android Chrome,
iOS Safari y escritorio; no presupongas que una app nativa está instalada.

## 8. Configurar el formulario RSVP

El formulario vive en `src/invitations/wedding/rsvpForm.ts` y necesita `id` y `version` estables. Los IDs de campo son
identificadores persistidos: cambiar una etiqueta es seguro; cambiar un ID requiere estrategia de migración.

Elementos v1: `text`, `email`, `number`, `date`, `textarea`, `radio`, `select`, `checkbox-group` e `info`.

Cada clave visible debe existir en todos los catálogos. Utiliza `visibleWhen` solo para comparar una respuesta anterior
con un valor primitivo y `completesForm` para opciones que terminan el flujo.

`completesForm` sigue en el contrato, pero **la invitación de ejemplo ya no lo usa**: «No podré asistir» lo llevaba y
enviaba desde el primer paso, y desde el 2026-09-07 el paso de dedicatoria no está condicionado a `attending`, así que
quien no puede ir también pasa por él —sigue teniendo algo que decir—. Úsalo si tu formulario tiene una respuesta que
de verdad cierra el flujo sin nada más que preguntar.

Al modificar campos:

1. Incrementa `form.version` si cambia el contrato persistido.
2. Mantén `submission.identityFieldId` y `attendanceFieldId` apuntando a campos existentes.
3. Actualiza columnas y métricas de Admin.
4. Prueba asistencia afirmativa, negativa, validaciones, navegación atrás y error de envío.

## 9. Activar RSVP y Admin

```ts
capabilities: {
    rsvp: {
        enabled: true,
            deadline
    :
        '2027-05-12T23:59:59+02:00',
            form
    :
        weddingRsvpForm,
    },
    admin: {
        enabled: true,
            auth
    :
        {
            method: 'otp'
        }
    ,
        source: 'rsvp',
            columns
    :
        ['fullName', 'attending'],
            metrics
    :
        {
            attendanceFieldId: 'attending'
        }
    ,
    },
}
```

- Sin RSVP, no existen la ruta RSVP, su CTA ni Admin.
- Admin requiere RSVP y se carga bajo demanda.
- `controls` activa CSV, búsqueda, ordenación, paginación, conteo y freshness.
- `deadline` es exclusivo: al alcanzarlo, el CTA comunica el cierre, desaparece la ruta RSVP y un formulario ya abierto
  no puede iniciar un nuevo envío.
- Admin sigue accesible después del deadline para consultar las respuestas existentes.
- `auth.method` admite `otp` o `password` y muestra únicamente el formulario elegido.
- Ambos métodos restauran una sesión Supabase y delegan la autorización de lectura en RLS.
- Los emails autorizados y su relación con cada invitación se provisionan fuera del navegador.

### Provisionar los emails en Supabase local

```powershell
Copy-Item .env.admin.example .env.admin.local
```

Edita únicamente `.env.admin.local`, que Git ignora, y ejecuta:

```powershell
pnpm admin:provision:local
```

El comando crea identidades OTP ausentes y verifica sus membresías sin duplicarlas. Con `password`, crea primero cada
usuario y su contraseña desde una operación privada de Supabase; después el mismo comando asigna las membresías. No
guardes contraseñas ni emails reales en `InvitationDefinition` o archivos versionados.

## 10. Preparar Supabase

Las respuestas se aíslan funcionalmente mediante `weddingInvitation.id`, que se mapea a `wedding_slug`. El mapper es el
único lugar autorizado para convertir DB ↔ dominio.

Las migraciones incrementales se aplican desde CI y reconstruyen una base vacía. Antes de desplegar seguridad y OTP,
sigue `DATABASE_MIGRATIONS.md` y `RSVP_SECURITY_MIGRATION_RUNBOOK.md`.

## 11. Desplegar una segunda boda

El motor sirve **una invitación por despliegue**. No hay selección en runtime ni multi-inquilino:
`src/invitations/wedding` se importa de forma estática desde `main.tsx`, y `vite.config.ts` importa
`invitations/wedding/theme.ts` para inyectar las fuentes del tema activo en tiempo de compilación.
Un build es una boda.

El tema se declara en su propio archivo justamente por eso. `vite.config.ts` corre en Node, donde
`import.meta.env` no existe; importar `invitation.ts` para leer un string metía todo el grafo del
navegador en el programa de Node, y el día que la invitación empezó a leer el entorno el build cayó
con `Cannot read properties of undefined`. Un string, importado por los dos lados.

Eso no es una limitación pendiente de resolver, es el modelo: este repositorio es una plantilla
que se instancia. Para una segunda boda se copia, se cambia el contenido de `src/invitations/` y se
despliega con sus propios secretos.

### Qué cambia en cada instancia

1. `src/invitations/wedding/` — identidad, `controller`, fechas, tema, secciones, catálogos y
   formulario. El `id` debe ser único: es el `wedding_slug` que separa las respuestas. Los nombres
   de la pareja **ya no viven aquí**: llegan por variables de entorno, ver «La pareja» en el punto 1.
2. Un proyecto propio de Cloudflare Pages.
3. Un proyecto propio de Supabase, o el mismo con otro `wedding_slug`. La RLS ya aísla por
   invitación desde Sprint 7.1.
4. Los administradores, provisionados con `pnpm admin:provision`.

### Los únicos mandos por despliegue

Verificado el 2026-09-04: fuera de `src/invitations/` ningún archivo de producción fija esta boda.
Las apariciones de `gala-y-valentin` que quedan están en pruebas y en el banco de migraciones, que
no viajan a ningún despliegue.

| Nombre | Tipo | Para qué |
|---|---|---|
| `CLOUDFLARE_API_TOKEN` · `CLOUDFLARE_ACCOUNT_ID` | Secret | Publicar en Pages |
| `CLOUDFLARE_PAGES_PROJECT` | Variable | Qué proyecto de Pages recibe el build |
| `SUPABASE_URL` · `SUPABASE_ANON_KEY` | Secret | Cliente del navegador |
| `SUPABASE_PROJECT_ID` · `SUPABASE_ACCESS_TOKEN` · `SUPABASE_DB_PASSWORD` | Secret | Migraciones y Edge Functions |
| `SUPABASE_SERVICE_ROLE_KEY` | Secret | Publicar la fecha de boda |
| `NARTEA_WEDDING_REGISTERED` | Variable | `false` en el primer despliegue de cada boda |
| `PARTNER_ONE` · `PARTNER_TWO` · `SURNAME_ONE` · `SURNAME_TWO` | Variable | La pareja. Opcionales; sin ellas rinden los nombres de la plantilla. El hashtag se deriva de ellas |
| `PARTNER_ONE_BG` · `PARTNER_TWO_BG` · `SURNAME_ONE_BG` · `SURNAME_TWO_BG` | Variable | Grafía de los idiomas que transliteran |

**Ojo con la última.** Es por boda, no global: una instancia nueva empieza en `false` para que el
`INSERT` falle en rojo si el slug ya pertenece a otra, y pasa a `true` tras el primer despliegue
correcto.

## 12. Validación manual

1. Landing con todas las secciones habilitadas y deshabilitadas de una en una.
2. Un idioma, varios sin selector y ES/EN/BG con selector.
3. RSVP afirmativo, negativo, validaciones y fallo de red.
4. Admin con datos, vacío, error, búsqueda, orden, filtros, paginación y CSV.
5. Los siete temas en Landing, RSVP y Admin.
6. 320, 390, 768 y 1440 px; teclado y zoom 200 %.
7. Safari iOS, Chrome Android y escritorio.
8. Vídeo, fullscreen progresivo y las tres opciones de mapa.

Finalmente, el responsable de validación ejecuta:

```powershell
pnpm lint
pnpm build
pnpm check:functions
```

`pnpm build` necesita `VITE_SUPABASE_URL` en el entorno. `pnpm check:functions` cubre las Edge Functions, que no
entran en `tsc -b`, y requiere Deno instalado.

No despliegues hasta completar `RELEASE_CHECKLIST.md`.

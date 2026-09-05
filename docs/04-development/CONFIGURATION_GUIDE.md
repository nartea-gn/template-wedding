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
- `rsvp-cta`.

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
        address
:
    'venue.ceremony.address',
        mapsQuery
:
    'Dirección postal completa',
}
```

`mapProviders` decide si se ofrecen mapa del dispositivo, Google Maps y Apple Maps. Comprueba siempre Android Chrome,
iOS Safari y escritorio; no presupongas que una app nativa está instalada.

## 8. Configurar el formulario RSVP

El formulario vive en `src/invitations/wedding/rsvpForm.ts` y necesita `id` y `version` estables. Los IDs de campo son
identificadores persistidos: cambiar una etiqueta es seguro; cambiar un ID requiere estrategia de migración.

Elementos v1: `text`, `email`, `number`, `date`, `textarea`, `radio`, `select`, `checkbox-group` e `info`.

Cada clave visible debe existir en todos los catálogos. Utiliza `visibleWhen` solo para comparar una respuesta anterior
con un valor primitivo y `completesForm` para opciones que terminan el flujo.

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
`src/invitations/wedding` se importa de forma estática desde `main.tsx` y desde `vite.config.ts`,
que inyecta las fuentes del tema activo en tiempo de compilación. Un build es una boda.

Eso no es una limitación pendiente de resolver, es el modelo: este repositorio es una plantilla
que se instancia. Para una segunda boda se copia, se cambia el contenido de `src/invitations/` y se
despliega con sus propios secretos.

### Qué cambia en cada instancia

1. `src/invitations/wedding/` — identidad, `controller`, fechas, tema, secciones, catálogos y
   formulario. El `id` debe ser único: es el `wedding_slug` que separa las respuestas.
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

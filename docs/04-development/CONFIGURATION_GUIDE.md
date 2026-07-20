# Guía de configuración de una invitación

Esta guía describe cómo crear una variante de invitación sin modificar el Core. La boda actual se encuentra en
`src/invitations/wedding` y sirve como implementación de referencia.

## 1. Preparar el entorno

```powershell
pnpm install --frozen-lockfile
Copy-Item .env.example .env
pnpm dev
```

Completa `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` y `VITE_ADMIN_PASSWORD`. No incluyas service-role keys ni otros
secretos privilegiados en variables `VITE_*`: Vite las incorpora al bundle público.

## 2. Definir una identidad única

Edita `src/invitations/wedding/invitation.ts`:

```ts
id: 'identificador-unico-del-evento'
```

El ID identifica las respuestas persistidas y debe permanecer estable durante la vida de la invitación. Cambiarlo en
una invitación desplegada separa el frontend de sus respuestas anteriores.

Configura también `event.type`, `event.date`, `event.timezone` y las claves localizadas de título/SEO. Hasta Sprint 7.3,
`seo` no actualiza los metadatos y `event.date` no sustituye automáticamente el target del countdown.

## 3. Elegir un tema

Los IDs válidos se derivan del registro en `src/design/themes/themes.ts`:

```ts
theme: {id: 'royal'}
```

Temas actuales: `royal`, `boho`, `dark`, `magnolia` y `linen`.

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
    supportedLocales: ['es', 'en', 'bg'],
    selector: {visible: true},
}
```

### Invitación monolingüe

```ts
supportedLocales: ['es'],
selector: {visible: false},
```

Con un único locale no se renderiza selector aunque `visible` se configure por error.

### Añadir un locale

1. Añade el código a `src/invitations/wedding/locales/types.ts`.
2. Crea un catálogo con las mismas claves que `es.ts`.
3. Registra su import dinámico en `locales/loaders.ts`; el catálogo por defecto se importa de forma estática.
4. Añádelo a `supportedLocales`.
5. Verifica textos largos, errores, fechas, Admin y formulario.

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

Para un tipo nuevo, define el contrato Core, implementa la Feature y regístrala en
`src/invitations/wedding/sectionRegistry.tsx`. No añadas lógica de boda al renderer genérico.

## 6. Registrar medios

Los componentes reciben IDs, no imports de activos desde la configuración:

1. Importa el archivo en `src/invitations/wedding/assets.ts`.
2. Regístralo con un ID estable.
3. Referencia ese ID desde la sección.

```ts
content: {
    assetId: 'wedding-hero-video',
    posterAssetId: 'wedding-hero-video-poster',
    preload: 'none',
    aspectRatio: '9 / 16',
}
```

Sigue `MEDIA_WORKFLOW.md` para comprimir el vídeo, crear el poster y validar `faststart`.

## 7. Configurar ubicaciones y mapas

Cada venue puede incluir `time`, clave localizada de dirección y una consulta estable:

```ts
{
    id: 'ceremony',
    typeLabel: 'venue.ceremony.type',
    name: 'venue.ceremony.name',
    time: '12:00',
    address: 'venue.ceremony.address',
    mapsQuery: 'Dirección postal completa',
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
        deadline: '2027-05-12',
        form: weddingRsvpForm,
    },
    admin: {
        enabled: true,
        source: 'rsvp',
        columns: ['fullName', 'attending'],
        metrics: {attendanceFieldId: 'attending'},
    },
}
```

- Sin RSVP, no existen la ruta RSVP, su CTA ni Admin.
- Admin requiere RSVP y se carga bajo demanda.
- `controls` activa CSV, búsqueda, ordenación, paginación, conteo y freshness.
- `deadline` todavía no cierra el flujo automáticamente; está pendiente de Sprint 7.3.
- La contraseña cliente actual no sustituye autenticación ni RLS restrictiva.

## 10. Preparar Supabase

Las respuestas se aíslan funcionalmente mediante `weddingInvitation.id`, que se mapea a `wedding_slug`. El mapper es el
único lugar autorizado para convertir DB ↔ dominio.

Las migraciones incrementales se aplican desde CI. El repositorio todavía no dispone de baseline completa para una base
vacía: antes de crear un proyecto nuevo, sigue `DATABASE_MIGRATIONS.md` y resuelve el plan de Sprint 7.1.

## 11. Validación manual

1. Landing con todas las secciones habilitadas y deshabilitadas de una en una.
2. Un idioma, varios sin selector y ES/EN/BG con selector.
3. RSVP afirmativo, negativo, validaciones y fallo de red.
4. Admin con datos, vacío, error, búsqueda, orden, filtros, paginación y CSV.
5. Los cinco temas en Landing, RSVP y Admin.
6. 320, 390, 768 y 1440 px; teclado y zoom 200 %.
7. Safari iOS, Chrome Android y escritorio.
8. Vídeo, fullscreen progresivo y las tres opciones de mapa.

Finalmente, el responsable de validación ejecuta:

```powershell
pnpm lint
pnpm build
```

No despliegues hasta completar `RELEASE_CHECKLIST.md`.

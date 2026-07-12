# Invitation Definition

Contrato declarativo entre una invitación y el motor. No contiene componentes, callbacks, consultas ni detalles de
proveedor. La primera implementación vive en `src/core/invitation` y la boda actual en `src/invitations/wedding`.

```ts
type InvitationDefinition<Locale extends string, Message extends string> = {
  id: string
  event: { type: string; timezone: string; date: string; title: Message }
  localization: {
    defaultLocale: string
    supportedLocales: readonly string[]
    selector: { visible: boolean }
  }
  theme: { id: string }
  seo: { title: Message; description: Message }
  sections: readonly InvitationSection<Message>[]
  capabilities: InvitationCapabilities
}
```

Las secciones serán una unión discriminada y el array determina su orden. RSVP soportará inicialmente `text`,
`textarea`, `select`, `radio` y `checkbox-group`, con ID, etiqueta, ayuda, obligatoriedad, opciones y validación básica.

Los textos se expresan mediante claves de catálogo tipadas. Los catálogos y sus futuros cargadores permanecen fuera de
la definición para mantenerla serializable. `MessageKey<typeof catalog>` evita utilizar claves inexistentes dentro de
una invitación TypeScript.

## Invariantes

- `id` sustituye progresivamente al `slug` actual.
- Fechas usan zona horaria explícita.
- IDs de secciones y campos son únicos.
- Admin requiere una fuente de respuestas.
- CTA RSVP requiere RSVP activo.
- El tema debe estar registrado.
- `defaultLocale` pertenece a `supportedLocales`.
- Una invitación con un solo locale no muestra selector.
- Un selector visible requiere al menos dos locales.
- Todos los catálogos comparten las claves obligatorias.

La definición podrá dividirse en archivos de contenido, tema, secciones y formularios; el motor recibe el objeto
agregado.

## Compatibilidad temporal

El adaptador `WeddingConfig` fue retirado en Sprint 3. Landing y los hooks actuales consumen directamente
`weddingInvitation`; `sections` gobierna el orden y visibilidad reales.

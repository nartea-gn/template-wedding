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

Las secciones son una unión discriminada y el array determina su orden. El Form Engine soporta `text`, `email`,
`number`, `date`, `textarea`, `select`, `radio`, `checkbox-group` e información no interactiva, con ID persistente,
etiqueta, ayuda, obligatoriedad, opciones, validación y visibilidad condicional.

Los textos se expresan mediante claves de catálogo tipadas. Los catálogos y sus cargadores permanecen fuera de la
definición para mantenerla serializable. `MessageKey<typeof catalog>` evita utilizar claves inexistentes dentro de una
invitación TypeScript y los catálogos secundarios se cargan bajo demanda.

## Invariantes

- `id` identifica la invitación en configuración y persistencia; debe ser único por despliegue.
- Fechas usan zona horaria explícita.
- IDs de secciones y campos son únicos.
- Admin requiere una fuente de respuestas.
- CTA RSVP requiere RSVP activo.
- El tema debe estar registrado.
- `defaultLocale` pertenece a `supportedLocales`.
- Una invitación con un solo locale no muestra selector.
- Un selector visible requiere al menos dos locales.
- Todos los catálogos comparten las claves obligatorias.

La definición puede dividirse en archivos de contenido, tema, secciones y formularios; el motor recibe el objeto
agregado.

## Contratos declarados pendientes de consumo completo

- `seo` está tipado y configurado, pero todavía no actualiza los metadatos del documento.
- `capabilities.rsvp.deadline` está tipado y configurado, pero todavía no bloquea CTA, ruta o envío.
- `event.date` y `countdown.content.target` pueden divergir porque hoy son dos valores independientes.

Sprint 7.3 debe implementar estas propiedades o retirarlas explícitamente. La configuración no debe aparentar un
comportamiento que el runtime todavía no garantiza.

## Compatibilidad temporal

El adaptador `WeddingConfig` fue retirado en Sprint 3. Landing y los hooks actuales consumen directamente
`weddingInvitation`; `sections` gobierna el orden y visibilidad reales.

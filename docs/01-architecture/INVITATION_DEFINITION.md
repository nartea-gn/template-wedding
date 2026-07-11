# Invitation Definition

Contrato declarativo entre una invitación y el motor. No contiene componentes, callbacks, consultas ni detalles de proveedor.

```ts
type InvitationDefinition = {
  id: string
  event: { type: 'wedding'; timezone: string; date: string; title: LocalizedText }
  localization: {
    defaultLocale: string
    supportedLocales: readonly string[]
    selector: { visible: boolean }
  }
  theme: { id: string }
  seo: { title: string; description: string }
  sections: InvitationSection[]
  capabilities: { rsvp?: RsvpCapability; admin?: AdminCapability }
}
```

Las secciones serán una unión discriminada y el array determina su orden. RSVP soportará inicialmente `text`, `textarea`, `select`, `radio` y `checkbox-group`, con ID, etiqueta, ayuda, obligatoriedad, opciones y validación básica.

Los textos podrán resolverse mediante claves de catálogo o estructuras localizadas tipadas. El sprint de contrato elegirá un único modelo para evitar dos mecanismos competidores.

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

La definición podrá dividirse en archivos de contenido, tema, secciones y formularios; el motor recibe el objeto agregado.

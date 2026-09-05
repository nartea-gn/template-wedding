# ADR-019 — Secciones de alojamiento e historia de la pareja

## Estado

Aceptado e implementado.

No sustituye a [ADR-007](./ADR-007-invitation-contract.md): aquella documenta por qué el Core
modelaba cinco secciones en su momento y se conserva sin editar. Esta amplía el contrato a siete.

**La sección `story` fue retirada del motor el 5 de septiembre de 2026 por
[`ADR-023`](./ADR-023-remove-story-section.md).** La mitad de alojamiento de este documento sigue
vigente y sin cambios; la de historia se conserva íntegra como registro de por qué el contrato se
diseñó así, no como descripción del producto actual.

## Contexto

Los invitados preguntan por alojamiento en las horas siguientes a recibir la invitación, y no
había dónde poner la respuesta: `VenueItemDefinition` solo genera enlaces de mapa, sin ningún
campo para una URL de reserva externa. Por otro lado, `PRODUCT_VISION.md` sitúa la historia del
evento como protagonista y el motor no ofrecía ningún sitio para la prosa de la pareja.

Ambas secciones estaban además anunciadas como incluidas en la landing sin existir en el motor.

## Decisión

### Alojamiento (`lodging`)

- `bookingUrl` es un `string` plano, no un `Message`: es un destino, no texto visible, igual que
  `mapsQuery`.
- El precio se modela como `priceTier: 1 | 2 | 3` con etiquetas por catálogo, no como cifra. Un
  precio real caduca con la temporada y crea justo la clase de promesa incumplida que motivó esta
  sección.
- Se descarta un campo de distancia numérico: se queda obsoleto en cuanto cambia el lugar y nadie
  lo revalida. El invitado llega a un mapa real en cuanto abre `bookingUrl`.
- Se descarta un campo `bookingCode`: un código de grupo casi nunca es un dato atómico. `noteKey`
  cubre el caso completo, con sus instrucciones, sin campo adicional.

### Historia (`story`)

> Retirada del motor por [`ADR-023`](./ADR-023-remove-story-section.md). Nada de lo que sigue
> describe el código actual: el tipo, el componente, la rama de validación y las reglas de estilo
> ya no existen. Se conserva porque el razonamiento sigue siendo válido si la sección vuelve.

- `paragraphs: readonly Message[]`, no una clave única con separadores. Ningún campo del motor
  codifica estructura dentro de un string, y partirlo en el componente introduciría una regla de
  parsing implícita que un traductor no ve.
- **Limitación aceptada:** el número de párrafos es igual en los tres idiomas por construcción.
  Un catálogo no puede fusionar dos bloques ni partir uno, porque cada clave se traduce por
  separado. Para 2-4 párrafos no es una limitación real.
- `imageAltKey` es obligatorio si hay `imageAssetId`, y la validación lo exige: el texto
  alternativo de una foto de pareja es contenido, no metadato.

### Común a ambas

- Título con `<h2>` real y `aria-labelledby`, en lugar del `<p className="...-label">` que usan
  las secciones anteriores: hoy la página no tiene nada navegable por encabezado salvo el `<h1>`
  del hero.
- Los enlaces externos anuncian que abren pestaña nueva, con la cadena en catálogo. El motor ya
  abría enlaces con `target="_blank"` sin decirlo en ningún sitio.

## Consecuencias

- `InvitationSection` pasa de cinco variantes a siete. `SectionRegistry` es un mapped type, así
  que omitir el renderer de una sección nueva no compila. **Desde
  [`ADR-023`](./ADR-023-remove-story-section.md) son seis**: `story` salió de la unión.
- Una invitación que no ofrezca alojamiento o historia simplemente no declara la entrada; no hay
  estado vacío que mantener dentro de los componentes.
- Coste recurrente para la pareja: la lista de alojamientos se mantiene a mano y nadie la
  sincroniza con disponibilidad ni tarifa real. La historia hay que escribirla en cada idioma que
  la invitación soporte, o aceptar conscientemente que uno herede el texto de otro. Ese segundo
  coste ya no se paga: [`ADR-023`](./ADR-023-remove-story-section.md) lo cita entre los motivos
  para retirar la sección.

## Nota sobre el catálogo búlgaro

> Describe el modelo de catálogos vigente cuando se escribió este ADR. **Ya no es así**: el spread
> estático se eliminó en Sprint 7.5A y hoy los tres catálogos declaran sus claves, con la cadena de
> fallback en `invitation.ts` y `catalogs.test.ts` exigiendo paridad entre ellos. El riesgo que
> describe el párrafo —una traducción olvidada que no falla en compilación— sí lo detecta ahora la
> suite. Se conserva sin editar porque documenta el porqué de aquella disciplina editorial.

`bg.ts` se construye como `{...enMessages, <overrides>}`. Olvidar una traducción no produce error
de compilación: TypeScript ve la clave heredada del spread. El resultado en producción no es un
hueco, es un invitado que eligió búlgaro y lee la sección en inglés, sin aviso. Es disciplina
editorial, no algo que el código pueda detectar.

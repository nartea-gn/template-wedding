# ADR-023 — Retirada de la sección de historia

## Estado

Aceptado e implementado el 5 de septiembre de 2026. **Sustituye** la mitad `story` de
[`ADR-019`](./ADR-019-lodging-and-story-sections.md); la mitad de alojamiento de aquel documento
sigue vigente sin un solo cambio.

## Contexto

La sección se entregó el 31 de agosto de 2026 y se retira cinco días después. Conviene decir por
qué con precisión, porque el motivo es más débil de lo que un ADR suele registrar: **no se
considera necesaria en el producto actual**. No hay medición que respalde la decisión. Ninguna
invitación real ha usado la sección todavía, así que no existe dato de uso que citar, ni queja de
pareja, ni coste operativo observado. Es un juicio de producto sobre el alcance del paquete de
evento, y queda anotado como tal.

Lo que sí estaba escrito de antemano son los dos costes que
[`ADR-019`](./ADR-019-lodging-and-story-sections.md) aceptó al introducirla: la prosa hay que
escribirla en cada idioma que la invitación soporte, y el número de párrafos queda acoplado entre
catálogos por construcción. `PRODUCT_BACKLOG.md` la tenía además clasificada como contenido
aplazado antes de entregarla, junto a galería, música y timeline. Retirarla la devuelve a esa
lista, de donde no debió salir sin una necesidad concreta.

## Decisión

**Se borra del motor, no se desactiva.**

Se retiran la instancia de la invitación demo y sus claves `story.*` en los tres catálogos, el
componente `StorySection`, su entrada en `weddingSectionRegistry`, el tipo `StorySection` y su
miembro en `InvitationSection`, el export público de `core/invitation`, la rama de validación y
las cinco reglas `.landing-story*` de `Landing.css`.

La alternativa era `enabled: false`, y se descarta. Un tipo de sección que nadie declara sigue
costando: un renderer que mantener, una rama de validación que probar, reglas de CSS que viajan en
el bundle y una entrada obligatoria en el mapped type del registry. Eso es exactamente la carpeta
`legacy` permanente que [`ADR-002`](./ADR-002-incremental-evolution.md) descarta —código que no
sirve a nadie y que nadie se atreve a tocar porque una bandera sugiere que podría volver.

Un ADR no se borra: la mitad `story` de `ADR-019` se conserva íntegra como registro de por qué el
contrato se diseñó así, con marcas internas que apuntan aquí.

## Consecuencias

- `InvitationSection` vuelve de siete variantes a seis. Una invitación que declare `type: 'story'`
  **no compila**; recuperar la sección es revertir este cambio, no cambiar una bandera.
- `validation.test.ts` pierde los dos casos que cubrían la rama borrada. La cobertura desaparece
  con el código que cubría, que es lo correcto: no queda rama sin probar.
- Los tres catálogos pierden cinco claves cada uno. `catalogs.test.ts` exige paridad entre ellos, así
  que borrarlas de uno solo habría roto la suite en vez de pasar desapercibido.
- `CONFIGURATION_GUIDE.md` deja de listar `story` como tipo declarable. Era la mentira más cara de
  las que dejaba este cambio: una guía operativa que ofrece un tipo que ya no existe.
- Coste hundido reconocido: cinco días entre entregar y retirar. Queda registrado para que la
  siguiente sección de contenido —galería, música, timeline— se valide contra una necesidad
  concreta antes de entrar al motor, no después.

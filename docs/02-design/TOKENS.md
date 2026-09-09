# Design Tokens

## Fuente de verdad

Los valores reutilizables viven en `src/design/tokens`. TypeScript aporta autocompletado, tipos derivados y uso
compartido con React. `toCssVariables` los expone a CSS sin obligar a los componentes a importar objetos de diseño.

## Categorías actuales

- `radius`: decisiones globales de foco y forma.
- `shadows`: fundamentos compartidos de foco.

> **Nota del 2026-09-07.** Eran seis. `colors` (`statusColors`), `typography`, `spacing` y `motion` se eliminaron: ni
> se exportaban desde el barril ni los importaba nadie, y las variables que `toCssVariables` derivaba de las dos
> últimas —`--spacing-18/88/128` y `--duration-400/600`— llegaban como estilos en línea en tiempo de ejecución, así que
> Tailwind no podía compilar utilidades a partir de ellas y ningún `p-18` ni `duration-400` existía. Los estados
> `success` y `danger` los lleva cada tema, no un token global.
>
> Con ellas se fueron las seis variables `--color-wedding-*-rgb` y los 42 valores mantenidos a mano que las
> alimentaban: cero referencias en CSS o TSX —el código usa `color-mix(in srgb, …)`, que no necesita tripletes— y era
> el mayor riesgo de corrección del sistema, porque nada detectaba un hex que dejara de coincidir con su copia por
> canales.

La regla que sigue vigente: no se crean escalas completas sin consumidores.

Los valores variables por identidad pertenecen al Theme, no a los tokens globales.

Theme Engine v2 añade `composition`, `motion`, `surfaces`, `decoration` e `iconography` al contrato de identidad. Estos
grupos no duplican las escalas globales: expresan decisiones que deben variar coordinadamente entre temas y que ya
tienen consumidores reales.

Los colores funcionales con impacto de contraste pertenecen al tema: `action`, `onAction`, `controlBorder`, `success`,
`successSurface`, `danger` y `dangerSurface`. `primary` conserva el color de identidad y no se utiliza automáticamente
como fondo de una acción. Esta separación mantiene colecciones suaves sin sacrificar contraste en botones o foco.

## Nomenclatura

El código TypeScript usa nombres semánticos (`background`, `cardLarge`, `durationNormal`). Las Custom Properties
actuales (`--color-wedding-bg`, `--shadow-card-lg`) se mantienen como frontera de compatibilidad mientras se migran
consumidores.

## Cuándo crear un token

Crear un token cuando una decisión se reutiliza, expresa una regla del sistema o debe cambiar coordinadamente. Un valor
local con una intención única puede permanecer junto al componente. No se tokenizan coordenadas o medidas accidentales
solo para eliminar un literal.

## Flujo

`tokens/theme TypeScript -> toCssVariables -> ThemeProvider -> Custom Properties -> Tailwind/CSS`

`toCssVariables` es el único adaptador permitido. Los componentes consumen Custom Properties semánticas y nunca importan
un tema concreto.

Los valores de `:root` son únicamente fallback de primer paint del tema inicial; el registro TypeScript gobierna el tema
activo.

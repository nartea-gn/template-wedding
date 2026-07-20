# Design Tokens

## Fuente de verdad

Los valores reutilizables viven en `src/design/tokens`. TypeScript aporta autocompletado, tipos derivados y uso
compartido con React. `toCssVariables` los expone a CSS sin obligar a los componentes a importar objetos de diseño.

## Categorías actuales

- `colors`: estados globales.
- `spacing`: tamaños adicionales que ya existían.
- `typography`: fallbacks globales.
- `radius`: decisiones globales de foco y forma.
- `shadows`: fundamentos compartidos de foco.
- `motion`: duraciones globales existentes.

No se crean escalas completas sin consumidores. Los valores variables por identidad pertenecen al Theme, no a los tokens
globales.

Theme Engine v2 añade `composition`, `motion`, `surfaces`, `decoration` e `iconography` al contrato de identidad. Estos
grupos no duplican las escalas globales: expresan decisiones que deben variar coordinadamente entre temas y que ya
tienen consumidores reales.

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

`toCssVariables` es el único adaptador permitido. Los componentes consumen Custom Properties semánticas y nunca
importan un tema concreto.

Los valores de `:root` son únicamente fallback de primer paint del tema inicial; el registro TypeScript gobierna el tema
activo.

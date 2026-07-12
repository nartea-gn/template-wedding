# Themes

## Contrato

Cada tema define cuatro grupos: `colors`, `typography`, `shadows` y `radius`. El tipo `ThemeId` se deriva de las claves
de `themes`; no debe duplicarse mediante una unión manual.

Temas actuales: `royal`, `boho`, `dark`, `magnolia` y `linen`.

## Añadir un tema

1. Añadir una entrada completa en `src/design/themes/themes.ts`.
2. Cargar sus familias tipográficas en la estrategia de fuentes vigente.
3. Añadir decoración en `patterns.css` solo si tiene una identidad propia.
4. Ejecutar lint y build.
5. Revisar Landing, RSVP y Admin en móvil y escritorio.

## Límites

Un tema puede variar identidad visual; no activa features, cambia contenido ni introduce lógica. Los patrones permanecen
en CSS porque son composición decorativa, pero sus colores de fondo consumen variables semánticas.

## Compatibilidad

Las Custom Properties existentes se preservan para evitar una migración masiva. `@theme` actúa como puente hacia
Tailwind v4 y no es un segundo registro de temas.


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

## Candidatos para Theme Engine v2

Sprint 6.3 confirma que el siguiente contrato de temas no deberia limitarse a color, tipografia, sombras y radios. Las
siguientes dimensiones ya tienen consumidores reales o decisiones repetidas:

- **Hero:** escala maxima de nombres, ritmo entre nombres/subtitulo/fecha y tratamiento del ampersand.
- **Ritmo vertical:** separacion entre secciones publicas, densidad de Landing y respiracion de RSVP.
- **Media:** ancho maximo del video, radio/elevacion y tono del boton de reproduccion.
- **Ornamentacion:** color, tamano y presencia de separadores como alianzas u otros motivos del evento.
- **Superficies:** opacidad relativa de cards, formularios y bloques informativos.
- **Interaccion:** diferencia entre hover desktop y active tactil para botones y opciones.

Estas dimensiones se documentan como entrada para 6.4, no como una obligacion de tokenizar todo inmediatamente. Theme
Engine v2 debera exponer solo aquello que permita crear estilos distintos sin filtrar logica de negocio al Core.

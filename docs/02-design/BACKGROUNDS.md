# Backgrounds temáticos

## Estado

Propuesta para revisión en Sprint 6.6.3. Esta especificación define una dirección candidata; no implica que los assets
finales estén producidos, integrados o aprobados.

## Objetivo

Cada colección debe sentirse como una pieza editorial continua, no como los mismos bloques sobre un color distinto.
Los fondos pueden aportar acuarela, papel, hojas, flores, brillo o textura siempre que el contenido conserve prioridad,
contraste y rendimiento.

Referencias de producto:

- [Specially Love](https://specially.love/) como referencia de catálogo y diferenciación entre colecciones;
- mocks `1000127697.png` y `1000127698.png` aportados por producto como dirección de composición, fondos periféricos y
  jerarquía ceremonial.

Los mocks todavía no disponen de una ubicación estable dentro del repositorio. Hasta incorporarlos con procedencia,
licencia y contexto de uso, se consideran una referencia conversacional y no evidencia reproducible de aprobación.

Las referencias se utilizan para identificar principios. No se copiarán ilustraciones, composiciones ni assets de
terceros.

## Relación con Nartea Studio

[Nartea Studio](https://github.com/nartea-gn/nartea-studio) es la fuente normativa para principios visuales, color,
profundidad, tokens y accesibilidad. Este documento define únicamente cómo materializa `template-wedding` esa dirección
en backgrounds responsive.

Referencias normativas actuales:

- `LD-001` — Principios visuales.
- `LD-002` — Color.
- `LD-006` — Profundidad.
- `LD-008` — Arquitectura de tokens.
- `LD-009` — Accesibilidad visual.

Si una decisión local contradice estos capítulos, deberá registrarse una excepción o actualizar primero la decisión
correspondiente en Nartea Studio.

## Anatomía del fondo

Un background temático puede combinar hasta tres capas visuales:

1. **Base:** color o degradado suave derivado del tema.
2. **Textura:** papel, grano o acuarela de muy bajo contraste.
3. **Arte periférico:** botánica, manchas, ramas u ornamentos anclados a bordes y esquinas.

El centro editorial debe permanecer limpio. El texto, los controles y las imágenes de contenido nunca se rasterizan
dentro del fondo.

## Frontera arquitectónica

La primera versión no amplía `ThemeDefinition`.

- `ThemeProvider` continúa aplicando `data-theme` y las Custom Properties.
- `src/themes/patterns.css` selecciona las capas decorativas fijas de cada colección mediante `data-theme`.
- Los assets viven bajo `src/assets/themes/<theme-id>/backgrounds/`.
- El responsive, la posición y la intensidad pertenecen a CSS.
- La Invitation Definition solo selecciona el `theme.id`; no conoce rutas de assets decorativos.

Esto conserva el Theme Engine tipado sin introducir callbacks, componentes o un catálogo remoto de fondos. Si en el
futuro un mismo tema necesita varias familias de background configurables, se diseñará un contrato nuevo a partir de
ese segundo caso real.

Los assets decorativos de colección no son contenido de la invitación. Fotografías, vídeos, nombres y textos siguen
perteneciendo a la Invitation Definition.

## Alcance por superficie

### Landing

Puede usar las tres capas y es la propietaria de la experiencia artística completa. Las decoraciones deben acompañar
el scroll y conectar Hero, countdown, media, celebración y CTA.

### RSVP

Puede reutilizar únicamente base y textura atenuada. El formulario necesita una zona de lectura estable y no debe
quedar rodeado por elementos de alto contraste.

### Admin

No usa arte ceremonial. Consume colores, tipografía de interfaz y tokens del tema, pero conserva un fondo operativo
simple para priorizar datos y controles.

## Comportamiento responsive

- Definir variantes mobile y wide cuando una misma composición no pueda recortarse con seguridad.
- Mantener una columna central libre y probar textos largos en ES, EN y BG.
- Anclar arte a bordes y esquinas; no estirar una acuarela de móvil hasta escritorio.
- Evitar `background-attachment: fixed` en móvil por coste de repintado y comportamiento inconsistente en Safari.
- No permitir overflow horizontal ni depender de una altura de página conocida.
- Los assets pueden continuar o alternarse por secciones; nunca debe usarse un único bitmap de toda la página.

## Rendimiento y formato

- Preferir AVIF/WebP para acuarelas y texturas; SVG solo para ornamentos vectoriales apropiados.
- Crear tamaños mobile y wide, cargar el adecuado mediante media queries y medir el resultado en el build desplegado.
- La experiencia debe seguir siendo comprensible si el background tarda o no carga.
- El background no puede convertirse en el elemento LCP ni bloquear la aparición del Hero.
- El presupuesto final se fijará después de comparar calidad visual y Core Web Vitals; no se aceptarán imágenes sin
  compresión ni dimensiones justificadas.

## Accesibilidad

- Las capas son decorativas y no exponen nombre accesible.
- El contraste se valida sobre la composición final, no solo sobre el color base del tema.
- Las superficies pueden aumentar opacidad localmente para proteger lectura, sin ocultar toda la dirección artística.
- No se comunica información exclusivamente mediante decoración o color.

## Dirección inicial por colección

| Tema | Dirección de background |
|---|---|
| Royal | Papel frío, azul tinta y detalles champagne; arte contenido y editorial. |
| Boho | Botánica oliva, tierra y fibras naturales; composición orgánica y asimétrica. |
| Dark | Negro mineral, profundidad sutil y destellos champagne; sin ruido visual continuo. |
| Magnolia | Acuarela marfil/rosa, pétalos y hojas suaves; mayor presencia floral periférica. |
| Linen | Papel cálido, ramas secas y tinta verde/gris; mínima ornamentación. |

## Criterios de aceptación de Sprint 6.6.3

- Royal conserva su identidad y actúa como baseline de fidelidad.
- Los cinco temas tienen una dirección reconocible sin alterar contenido ni orden de secciones.
- Landing se valida en 320, 390, 768 y 1440 px; RSVP se valida al menos en móvil y escritorio.
- Admin no recibe arte decorativo.
- No existe texto rasterizado, overflow horizontal ni pérdida de contraste AA.
- Los fondos degradan correctamente si un asset falla y respetan el primer render.
- Producto compara y aprueba capturas equivalentes antes de integrar todos los assets finales.

## No objetivos

- Constructor visual de fondos.
- Backgrounds cargados desde Supabase.
- Variantes ilimitadas por cliente.
- Copiar diseños o recursos de las referencias.
- Incluir Galería, Historia o Música en este incremento.

# Backgrounds temáticos

## Estado

Implementación responsive completa en Sprint 6.6.3 y pendiente de validación final de producto. Royal continúa siendo el
baseline visual; Boho, Dark, Magnolia y Linen ya disponen de composiciones hermanas para móvil, tablet y escritorio.

## Objetivo

Cada colección debe sentirse como una pieza editorial continua, no como los mismos bloques sobre un color distinto. Los
fondos pueden aportar acuarela, papel, hojas, flores, brillo o textura siempre que el contenido conserve prioridad,
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

El sistema utiliza una apertura responsive y un segundo módulo de cuerpo por colección en Landing:

1. **Imagen de apertura:** composición `narrow`, `medium` o `wide` seleccionada mediante media query.
2. **Módulo de cuerpo:** imagen serena y repetible que prolonga el mismo material y arte periférico.
3. **Color de respaldo:** token de fondo del tema, visible si un asset no carga.
4. **Contenido HTML:** texto, controles e imágenes de contenido independientes del fondo.

No se añaden texturas CSS, degradados decorativos, velos de color ni modos de mezcla. Las imágenes se presentan casi
opacas para evaluar con fidelidad el arte aprobado.

`background-size: cover` conserva siempre la proporción original. Puede recortar parte de la periferia cuando cambia la
relación de aspecto de la pantalla, pero nunca estira ni deforma la ilustración.

## Frontera arquitectónica

La primera versión no amplía `ThemeDefinition`.

- `ThemeProvider` continúa aplicando `data-theme` y las Custom Properties.
- `src/themes/patterns.css` selecciona las capas decorativas fijas de cada colección mediante `data-theme`.
- Los assets viven bajo `src/assets/themes/<theme-id>/backgrounds/`.
- El responsive, la posición y la intensidad pertenecen a CSS.
- La Invitation Definition solo selecciona el `theme.id`; no conoce rutas de assets decorativos.

Esto conserva el Theme Engine tipado sin introducir callbacks, componentes o un catálogo remoto de fondos. Si en el
futuro un mismo tema necesita varias familias de background configurables, se diseñará un contrato nuevo a partir de ese
segundo caso real.

Los assets decorativos de colección no son contenido de la invitación. Fotografías, vídeos, nombres y textos siguen
perteneciendo a la Invitation Definition.

## Alcance por superficie

### Landing

Muestra una imagen temática casi opaca durante la apertura. Un fundido limitado al final de esta composición la conecta
con un módulo de cuerpo de la misma familia visual. El módulo continúa durante el resto de la página y evita el salto
hacia un color plano. No se duplica la apertura como decoración de cierre.

### RSVP

Reutiliza el mismo asset responsive de la colección casi opaco y a pantalla completa. El formulario y el estado de éxito
conservan una superficie estable y protegida; el encuadre no cambia entre pasos.

### Admin

No usa arte ceremonial. Consume colores, tipografía de interfaz y tokens del tema, pero conserva un fondo operativo
simple para priorizar datos y controles.

## Comportamiento responsive

- Usar `narrow` por debajo de 768 px, `medium` entre 768 y 1279 px y `wide` desde 1280 px.
- Seleccionar composiciones hermanas por breakpoint y usar `cover` para preservar su proporción sin deformarlas.
- Mantener una columna central libre y probar textos largos en ES, EN y BG.
- Anclar arte a bordes y esquinas; no estirar una acuarela de móvil hasta escritorio.
- Evitar `background-attachment: fixed` en móvil por coste de repintado y comportamiento inconsistente en Safari.
- No permitir overflow horizontal ni depender de una altura de página conocida.
- Los assets pueden continuar o alternarse por secciones; nunca debe usarse un único bitmap de toda la página.

## Rendimiento y formato

- Entregar todos los backgrounds rasterizados activos en WebP. Los JPEG intermedios se conservan únicamente como copia
  de seguridad fuera de `src`; SVG se reserva para ornamentos vectoriales apropiados.
- Crear tamaños `narrow`, `medium` y `wide`, cargar uno mediante media queries y medir el resultado desplegado.
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

| Tema     | Dirección de background                                                            |
|----------|------------------------------------------------------------------------------------|
| Royal    | Papel frío, azul tinta y detalles champagne; arte contenido y editorial.           |
| Boho     | Botánica oliva, tierra y fibras naturales; composición orgánica y asimétrica.      |
| Dark     | Negro mineral, profundidad sutil y destellos champagne; sin ruido visual continuo. |
| Magnolia | Acuarela marfil/rosa, pétalos y hojas suaves; mayor presencia floral periférica.   |
| Linen    | Papel cálido, ramas secas y tinta verde/gris; mínima ornamentación.                |

## Sistema activo

`BG-ROYAL-001` continúa como baseline y se completa con una variante tablet. `BG-BOHO-001`, `BG-DARK-001`,
`BG-MAGNOLIA-001` y `BG-LINEN-001` materializan las cuatro direcciones restantes. Cada familia tiene tres composiciones
de apertura y tres módulos de cuerpo art-directed bajo `src/assets/themes/<theme-id>/backgrounds/`.

Landing, RSVP y el estado de éxito las seleccionan mediante media queries y Custom Properties en
`src/themes/patterns.css`. `ThemeDefinition` e Invitation Definition permanecen sin rutas de assets; Admin no recibe
arte ceremonial.

RSVP y éxito presentan una única imagen por superficie y breakpoint con una opacidad de `0.93` (`0.95` en Dark), sin
overlays ni mezcla adicional.

Las cinco colecciones incorporan el patrón modular aprobado en Landing: la apertura se funde durante su tramo final con
un módulo de cuerpo repetible. El módulo conserva el mismo papel, paleta y arte periférico, permanece a plena opacidad y
acompaña todo el scroll. No se repite la apertura completa ni se modifica el color de los assets.

La variante `medium` se mantiene hasta 1279 px para que pantallas como 1024 × 768 reciban una composición 4:3. La
variante panorámica `wide` comienza en 1280 px, cuando la anchura permite conservar mejor sus elementos periféricos.

### Continuidad modular aprobada

La primera validación de imagen única dejaba un salto perceptible entre la apertura y el color plano. Royal validó una
separación de responsabilidades que ahora aplican las cinco colecciones:

1. la apertura actúa como portada;
2. el módulo de cuerpo proporciona papel y ornamentación lateral serena durante el resto del recorrido.

La transición se resuelve superponiendo ambas imágenes únicamente en el final de la apertura. El contenido permanece en
HTML y el fondo puede crecer independientemente del idioma o de la altura total.

Royal recibió aprobación de producto el 2026-07-29. Boho, Dark, Magnolia y Linen adoptan desde esa fecha el mismo
contrato de apertura y cuerpo, manteniendo una dirección artística propia y tres composiciones responsive.

### Candidatos descartados

- `BG-ROYAL-002`, canvas continuo, se descartó porque su ajuste a alturas variables deformaba la ilustración y se
  alejaba del papel frío aprobado.
- `BG-ROYAL-003`, apertura modular, se descartó porque la escala floral competía con los nombres y dejaba el resto del
  recorrido visualmente vacío.
- Sus archivos se conservan temporalmente, sin referencias desde CSS, únicamente para trazabilidad y comparación.

La validación final debe comprobar:

- intensidad y continuidad del arte durante el scroll;
- legibilidad del Hero, countdown, vídeo, venues y CTA;
- ausencia de repeticiones o cortes visuales inaceptables;
- estabilidad del encuadre en todos los pasos de RSVP;
- peso y comportamiento del fallback.

## Criterios de aceptación de Sprint 6.6.3

- Royal conserva su identidad y actúa como baseline de fidelidad.
- Los cinco temas tienen una dirección reconocible sin alterar contenido ni orden de secciones.
- Landing se valida en 320, 390, 768, 1024 y 1440 px; RSVP se valida al menos en móvil, tablet y escritorio.
- La imagen se percibe casi opaca y no existen capas visuales adicionales que modifiquen su color.
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

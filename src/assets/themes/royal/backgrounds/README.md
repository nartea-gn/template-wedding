# BG-ROYAL-001 — Royal watercolor background

## Estado y uso

`BG-ROYAL-001` es el baseline visual activo. RSVP y éxito utilizan una única composición responsive. Landing prueba un
sistema modular que combina una apertura artística con un cuerpo repetible sereno para mantener continuidad durante todo
el scroll. Admin no consume estos assets.

## Archivos activos

| Variante                       | Dimensiones de origen | Entrega          | Uso           |
|--------------------------------|----------------------:|------------------|---------------|
| `royal-watercolor-mobile.webp` |         864 × 1821 px | WebP, calidad 82 | 320–767 px    |
| `royal-background-medium.webp` |        1448 × 1086 px | WebP, calidad 82 | 768–1279 px   |
| `royal-watercolor-wide.webp`   |         1815 × 866 px | WebP, calidad 82 | Desde 1280 px |

Los PNG originales no forman parte del bundle. La variante intermedia es una composición hermana generada
específicamente para tablet; no es un recorte automático de los masters existentes.

### Revisión móvil Royal Soft A

Producto aprobó `Royal Soft A` como apertura móvil oficial el 2026-08-03. La revisión conserva la composición, el
papel marfil, la botánica y los acentos champagne de `BG-ROYAL-001`, pero transforma las masas azul marino laterales en
azul pizarra empolvado y azul niebla. El ajuste protege la lectura del countdown en pantallas estrechas desde el propio
arte, sin tarjetas, halos, overlays ni excepciones de layout.

El master aprobado mantiene las dimensiones oficiales de `864 × 1821 px`. Su WebP de producción usa calidad 82 y la
copia JPEG de seguridad conserva calidad 92.

## Módulos de cuerpo de la prueba

| Variante                 | Dimensiones | Entrega          | Uso                                       |
|--------------------------|------------:|------------------|-------------------------------------------|
| `royal-body-narrow.webp` | 1024 × 1536 | WebP, calidad 84 | Continuidad vertical por debajo de 768 px |
| `royal-body-medium.webp` | 1448 × 1086 | WebP, calidad 84 | Continuidad entre 768 y 1279 px           |
| `royal-body-wide.webp`   |  1672 × 941 | WebP, calidad 84 | Continuidad desde 1280 px                 |

Los módulos mantienen un centro marfil limpio y concentran acuarela y botánica de baja intensidad en los extremos. Se
repiten verticalmente detrás de Landing y quedan cubiertos por la apertura en el primer viewport. La unión utiliza
únicamente un fundido breve entre dos imágenes; no añade color, textura CSS ni un overlay opaco.

Las copias JPEG de seguridad viven en `references/theme-backgrounds-jpg/royal/` y no forman parte del bundle.

## Candidatos descartados conservados

| Candidato      | Archivos                                                                           | Motivo de descarte                                                                                 |
|----------------|------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------|
| `BG-ROYAL-002` | `royal-watercolor-continuous-mobile.webp`, `royal-watercolor-continuous-wide.webp` | El canvas completo se deformaba al adaptarse a alturas variables y alteraba el papel Royal.        |
| `BG-ROYAL-003` | `royal-opening-mobile.webp`, `royal-opening-wide.webp`                             | La composición floral competía con el Hero y no mantenía continuidad en el resto de la invitación. |

Estos cuatro archivos no tienen referencias desde CSS y se mantienen temporalmente solo para trazabilidad. No deben
entrar en el bundle ni utilizarse como base de nuevas variantes sin una nueva aprobación de producto.

## Procedencia

- Herramienta: generador de imágenes integrado de Codex.
- Fecha del baseline: 2026-07-20. Variante tablet: 2026-07-28. Módulos de cuerpo: 2026-07-29. Revisión móvil
  `Royal Soft A`: 2026-08-03.
- Tipo: obra generada específicamente para Nartea; no contiene assets ni texto de las referencias de producto.
- Dirección: mocks aportados por producto y principios de `docs/02-design/BACKGROUNDS.md`.

## Prompt de los módulos de cuerpo

Los tres módulos se generaron individualmente utilizando su apertura responsive como referencia de estilo. El prompt
común pidió:

- papel de algodón marfil con acuarela Royal;
- centro editorial limpio;
- hojas azul marino, azul niebla y gris frío limitadas a los extremos;
- acentos champagne muy contenidos;
- continuidad vertical;
- ausencia de texto, marcos, sombras, objetos y bouquets dominantes;
- composición serena y sin simetría evidente.

## Prompt final de la variante wide activa

```text
Use case: stylized-concept
Asset type: responsive wide website background for the Royal wedding invitation theme
Primary request: Create a landscape sibling of the referenced vertical watercolor background, preserving its Royal visual identity.
Input image: reference image for palette, botanical language, watercolor texture, paper tone, and edge treatment; do not simply stretch or crop it.
Style/medium: elegant hand-painted watercolor on subtly textured ivory paper.
Composition/framing: wide landscape canvas; navy and desaturated blue watercolor blooms, translucent warm beige leaves, and restrained champagne-gold botanical accents anchored only along the far left and right edges and corners; keep a very large uninterrupted low-contrast editorial center for readable website content; asymmetrical, refined, airy.
Color palette: deep navy ink, dusty blue, warm ivory, pale beige, restrained champagne gold.
Constraints: no text, no letters, no people, no frames, no UI, no logos, no watermark; no important decoration in the central 60 percent; avoid a repeated wallpaper look; preserve generous negative space; production-ready background asset.
```

## Reglas

- El centro debe conservar contraste suficiente para contenido en ES, EN y BG.
- No usar `background-attachment: fixed`.
- El color base del tema actúa como fallback si el asset no carga.
- No rasterizar nombres, fechas, controles ni contenido dentro del background.
- Landing presenta el arte con mayor intensidad; RSVP conserva la identidad con una intensidad inferior.
- Admin mantiene su fondo operativo sin arte ceremonial.

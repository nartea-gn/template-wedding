# BG-ROYAL-001 — Royal watercolor background

## Uso

Fondo artístico responsive de la Landing para la colección Royal. Mantiene el centro editorial limpio y concentra
la acuarela, la botánica y los acentos champagne en los bordes. RSVP y Admin no consumen estos assets.

## Archivos

| Variante | Dimensiones de origen | Entrega | Uso |
|---|---:|---|---|
| `royal-watercolor-mobile.webp` | 864 × 1821 px | WebP, calidad 82 | Móvil y tablet vertical |
| `royal-watercolor-wide.webp` | 1815 × 866 px | WebP, calidad 82 | Escritorio desde 64 rem |

Los PNG originales no forman parte del bundle. Las variantes WebP pesan aproximadamente 129 KB y 109 KB.

## Procedencia

- Herramienta: generador de imágenes integrado de Codex.
- Fecha: 2026-07-20.
- Tipo: obra generada específicamente para Nartea; no contiene assets ni texto de las referencias de producto.
- Dirección: mocks aportados por producto y principios de `docs/02-design/BACKGROUNDS.md`.

## Prompt final de la variante wide

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

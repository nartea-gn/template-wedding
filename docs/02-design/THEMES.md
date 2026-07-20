# Themes

## Contrato v2

Cada tema es una definición TypeScript completa en `src/design/themes/themes.ts`. `ThemeId` se deriva de las claves del
registro y nunca debe mantenerse como una unión manual.

El contrato contiene nueve grupos:

- `colors`: paleta de identidad, acción, controles y estados semánticos, junto con los equivalentes RGB necesarios;
- `typography`: familias de heading y body;
- `shadows`: elevaciones compartidas;
- `radius`: forma de cards y controles;
- `composition`: ritmo de secciones y anchos editoriales/media;
- `motion`: reveal e interacción;
- `surfaces`: opacidad de cards de contenido y formularios;
- `decoration`: color y presencia de ornamentos;
- `iconography`: grosor de los SVG propios de interfaz.

Temas actuales: `royal`, `boho`, `dark`, `magnolia` y `linen`.

Los ornamentos ceremoniales usan un acento secundario propio en cada tema. No deben reutilizar automáticamente el
color principal: su función es acompañar títulos y cifras con un contraste sutil, siguiendo el criterio visual de
`royal`.

## Flujo

```text
ThemeDefinition
    -> themes[themeId]
    -> toCssVariables
    -> ThemeProvider
    -> Custom Properties + data-theme
    -> CSS responsive
```

`ThemeProvider` no conoce componentes ni dominios. Aplica el conjunto completo antes del pintado del cliente y
`data-theme` selecciona únicamente patrones decorativos CSS.

## Relación con Nartea Studio

[Nartea Studio](https://github.com/nartea-gn/nartea-studio) define el lenguaje visual, los roles tipográficos, los
tokens y sus criterios de validación. `template-wedding` es una implementación de referencia: define el contrato
TypeScript, la conversión a Custom Properties y los límites técnicos necesarios para consumirlos.

Las referencias normativas son `LD-002`, `LD-003`, `LD-008`, `LD-009`, `DDR-0001` y `DDR-0002`. Este repositorio puede
registrar decisiones de implementación mediante ADR, pero no debe crear un sistema visual paralelo.

La correspondencia mínima con `LD-002` es:

| Nartea Studio | `ThemeDefinition` | Custom Property |
|---|---|---|
| `action-primary` | `colors.action` | `--color-wedding-action` |
| `action-on-primary` | `colors.onAction` | `--color-wedding-on-action` |
| `control-border` | `colors.controlBorder` | `--color-wedding-control-border` |
| `success` | `colors.success` | `--color-wedding-success` |
| `success-surface` | `colors.successSurface` | `--color-wedding-success-surface` |
| `error` | `colors.danger` | `--color-wedding-danger` |
| `error-surface` | `colors.dangerSurface` | `--color-wedding-danger-surface` |

`danger` es actualmente un nombre de compatibilidad de la implementación para el estado de error. No deberá
reutilizarse también para acciones destructivas sin separar antes ambos significados en el contrato.

Los backgrounds artísticos siguen esta misma frontera: `data-theme` selecciona assets decorativos fijos de colección
desde CSS, mientras el responsive y el recorte permanecen fuera del contrato TypeScript. La especificación está en
[`BACKGROUNDS.md`](./BACKGROUNDS.md).

## Identidad de los temas

| Tema     | Ritmo                 | Motion               | Superficie        | Ornamentación      |
|----------|-----------------------|----------------------|-------------------|--------------------|
| Royal    | Editorial equilibrado | Elegante y contenido | Ligera            | Champagne visible  |
| Boho     | Amplio y orgánico     | Suave                | Cálida y presente | Latón cálido       |
| Dark     | Compacto              | Rápido               | Más sólida        | Champagne luminoso |
| Magnolia | Amplio y romántico    | Delicado             | Suave             | Champagne rosado   |
| Linen    | Sobrio y estrecho     | Sereno               | Muy ligera        | Latón suave        |

Estas diferencias son valores coordinados, no variantes estructurales.

### Compatibilidad visual de Royal

`royal` es el tema de referencia y conserva deliberadamente la combinación histórica de la plantilla: serif de
sistema (`ui-serif`, Georgia, Cambria y equivalentes) para títulos y cifras, y Josefin Sans para texto e interfaz.
No debe sustituirse su serif por Playfair Display durante la evolución del motor. Los demás temas pueden usar sus
propias combinaciones tipográficas, pero deben mantener una jerarquía y legibilidad equivalentes.

## Añadir un tema

1. Añadir una entrada completa en `src/design/themes/themes.ts` que satisfaga `ThemeDefinition`.
2. Elegir valores semánticos; no copiar reglas CSS o nombres de componentes dentro del objeto.
3. Cargar sus familias tipográficas mediante la estrategia documentada en `MEDIA.md`.
4. Añadir un patrón o background en `src/themes/patterns.css` solo si aporta una identidad reconocible y cumple
   `BACKGROUNDS.md`.
5. Seleccionar temporalmente el tema desde la definición de invitación y revisar Landing, RSVP y Admin.
6. Validar 320 px, móvil habitual, tablet y escritorio, incluyendo foco, hover/active y reduced motion.
7. Ejecutar `pnpm lint` y `pnpm build`.

Añadir un tema no requiere modificar `ThemeProvider`, `toCssVariables` ni componentes.

## Límites

Un tema puede variar identidad visual. Nunca puede:

- activar features;
- cambiar contenido o traducciones;
- reordenar secciones;
- contener componentes React, funciones, callbacks o assets de contenido;
- depender de bodas u otro dominio de evento.

El responsive permanece en CSS. El tema aporta valores semánticos, no reglas de composición completas.
Los assets decorativos fijos de una colección son presentación seleccionada por `data-theme`; no se consideran
contenido y no se configuran desde la invitación.

## Compatibilidad

Las Custom Properties v1 se mantienen durante la adopción de v2. Los fallbacks de `:root` reflejan `royal` para el
primer documento y `prefers-reduced-motion` prevalece sobre cualquier duración configurada por un tema.

`--color-wedding-error` permanece como alias legado de `--color-wedding-danger` durante la transición. Los nuevos
consumidores deberán utilizar el rol documentado y evitar introducir colores de estado locales.

La decisión arquitectónica completa está en `ADR-013-theme-engine-v2.md`.

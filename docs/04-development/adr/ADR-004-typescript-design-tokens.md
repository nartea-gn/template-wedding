# ADR-004: TypeScript design tokens with CSS variable output

- Estado: aceptado
- Fecha: 2026-07-11

## Contexto

Los valores visuales estaban repartidos entre `src/themes/index.ts`, `src/index.css` y `src/themes/patterns.css`. Los tipos de tema también se duplicaban en configuración.

## Opciones

1. Mantener tokens únicamente en CSS.
2. Generar CSS durante build desde una herramienta de tokens.
3. Modelar tokens y temas en TypeScript y traducirlos a Custom Properties con una función pura.

## Decisión

Adoptar la opción 3. No se añade generador ni dependencia. CSS y Tailwind consumen la salida mediante las variables existentes.

## Consecuencias

- Una sola fuente tipada para temas y valores compartidos.
- `ThemeId` se deriva del registro.
- Existe un adaptador pequeño y explícito.
- `:root` conserva fallbacks del tema inicial para evitar un primer paint sin estilo.
- Los patrones decorativos siguen en CSS y no forman parte del modelo TypeScript.

## Trabajo futuro

Medir el flash de tema, revisar carga de fuentes y retirar aliases de compatibilidad solo cuando todos los consumidores hayan migrado.

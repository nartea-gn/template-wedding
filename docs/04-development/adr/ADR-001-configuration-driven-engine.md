# ADR-001: Configuration-driven engine

- Estado: aceptado
- Fecha: 2026-07-11

## Contexto

La configuración actual centraliza datos, pero páginas y rutas fijan orden, textos y preguntas.

## Opciones

1. Duplicar componentes por invitación.
2. Acumular booleanos en páginas.
3. Definición declarativa, motor y registro tipado.

## Decisión

Adoptar la opción 3 incrementalmente. La configuración expresa metadatos, contenido, secciones, tema y capabilities; nunca funciones, componentes o infraestructura.

## Consecuencias

Reduce cambios por cliente y exige validación. No se convertirá en un CMS o lenguaje de programación en v1.


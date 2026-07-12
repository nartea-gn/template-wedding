# ADR-006: Configuration-driven internationalization

- Estado: aceptado como arquitectura; implementación pendiente
- Fecha: 2026-07-11

## Contexto

Los textos actuales viven parcialmente en configuración y parcialmente en JSX. Las invitaciones pueden requerir uno o
varios idiomas y un selector visible u oculto.

## Opciones

1. Duplicar una invitación por idioma.
2. Añadir condiciones de idioma dentro de componentes.
3. Declarar locales en `InvitationDefinition` y resolver catálogos mediante un contrato común.

## Decisión

Adoptar la opción 3. Una invitación declara locale predeterminado, locales soportados y visibilidad del selector. Los
catálogos secundarios se cargan bajo demanda.

## Consecuencias

- Un idioma sigue siendo el caso más pequeño y no muestra toggle.
- Secciones y Form Engine consumen contenido localizado sin conocer almacenamiento de catálogos.
- Faltas de traducción pueden validarse antes del despliegue.
- Deben localizarse también validaciones, errores, fechas y SEO.

## Decisión diferida

La elección entre una librería consolidada y un resolvedor pequeño propio se hará después de definir el contrato y medir
necesidades de plurales, interpolación y división de bundles.

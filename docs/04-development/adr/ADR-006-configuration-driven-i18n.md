# ADR-006: Configuration-driven internationalization

- Estado: aceptado e implementado
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
- Validaciones, errores, fechas y Admin usan el runtime común; SEO permanece pendiente de consumo en Sprint 7.3.

## Implementación

Se adoptó un runtime propio pequeño porque los requisitos actuales son claves tipadas, fallback, persistencia, `Intl` y
carga diferida. Español es el idioma predeterminado; inglés y búlgaro se importan al solicitarlos. El selector solo se
renderiza con al menos dos idiomas y `selector.visible: true`.

Una librería externa se reconsiderará únicamente si aparecen necesidades reales de pluralización compleja, interpolación
avanzada o gestión remota que el contrato actual no pueda cubrir de forma mantenible.

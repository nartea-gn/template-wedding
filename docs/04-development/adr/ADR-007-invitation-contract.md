# ADR-007: Serializable invitation contract with typed message keys

- Estado: aceptado e implementado
- Fecha: 2026-07-11

## Contexto

La configuración anterior mezclaba datos de la boda con una forma diseñada para las páginas actuales. La nueva
definición debe servir al futuro renderer, permitir localización y permanecer independiente de React e infraestructura.

## Opciones

1. Guardar todos los textos directamente dentro de cada sección.
2. Guardar mapas `{ es, en }` en cada campo textual.
3. Referenciar claves tipadas y mantener un catálogo por locale fuera de la definición.

## Decisión

Adoptar la opción 3. `InvitationDefinition<Locale, Message>` es serializable y las secciones utilizan `Message`. Cada
catálogo TypeScript deriva su unión de claves mediante `MessageKey`.

El Core modela únicamente las secciones presentes: Hero, Countdown, Video, Venue y RSVP CTA. RSVP y Admin aparecen como
capabilities estructurales, sin implementar todavía su motor.

## Consecuencias

- Las claves inexistentes fallan durante type-check.
- Los catálogos pueden dividirse por locale sin insertar loaders en la definición.
- La configuración de una invitación no contiene JSX, funciones ni Supabase.
- Un adaptador temporal mantiene `WeddingConfig` para las páginas actuales.
- Añadir un tipo de sección requiere ampliar la unión hasta que exista un registro extensible en Sprint 3.

## Validación

La definición comprueba locales, IDs únicos y coherencia entre RSVP CTA, RSVP y Admin al cargar el módulo. Lint y build
se ejecutan con TypeScript 7.

# ADR-009: React section registry outside the Core

- Estado: aceptado e implementado
- Fecha: 2026-07-12

## Contexto

`InvitationDefinition.sections` describía la experiencia, pero Landing seguía componiendo Hero, Countdown, Video, Venue
y CTA manualmente. El Core debe continuar independiente de React.

## Decisión

Mantener contratos y discriminantes en `src/core/invitation` y ubicar `InvitationRenderer` y `SectionRegistry` en
`src/app/invitation`. Las secciones visuales viven en `src/features/sections`; cada invitación compone su registro y
resuelve assets serializables.

El registro es un mapa explícito de los tipos existentes, no un sistema de plugins. Una única aserción de tipo queda
encapsulada en la frontera dinámica entre el discriminante y React.

## Consecuencias

- El array de secciones controla orden y visibilidad.
- Una sección desactivada no se monta ni ejecuta efectos.
- Landing deja de conocer componentes concretos.
- Venue admite cualquier cantidad de items.
- Los assets no entran en el Core ni en la definición.
- Añadir una sección requiere contrato, componente y registro, pero no modificar el renderer.
- `legacyConfig` y `wedding.config.ts` desaparecen.

## Trabajo futuro

Las rutas asociadas a capabilities y el Form Engine se abordarán en sprints posteriores. No se añadirá descubrimiento
dinámico de plugins sin una segunda necesidad real.

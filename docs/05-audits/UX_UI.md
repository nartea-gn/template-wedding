# UX/UI Audit

## Estado

La invitación usa definición declarativa, Section Registry, Form Engine, localización Core y cinco temas. Sprint 6.1
consolida la experiencia funcional antes del trabajo de medios y refinamiento visual de 6.2–6.3.

## Hallazgos

- CTA, rutas y formulario ya responden a capabilities y configuración.
- RSVP usaba dos superficies `.card`; Sprint 6.1 deja un único propietario visual.
- Los emojis de interfaz se sustituyen por SVG mínimos reutilizables y estables entre plataformas.
- Las rutas lazy muestran un estado localizado en vez de un flash vacío.
- Form Engine agrupa opciones semánticamente, relaciona errores y ayuda, y gestiona foco entre pasos.
- El selector de idioma deja de flotar sobre el contenido y se desplaza con el documento.
- `prefers-reduced-motion` está disponible; Sprint 6.1 elimina transiciones `all` y movimiento en tarjetas no
  interactivas.
- Los temas modifican colores, fuentes, sombras, radios y fondos; es una base valiosa que debe preservarse.
- Vídeo, hero y ritmo narrativo siguen siendo el foco de 6.2–6.3.

## Principios para el rediseño

1. Una intención principal por sección.
2. Fotografía y contenido por encima de ornamentos.
3. CTA solo cuando exista una acción real.
4. Formularios adaptados a las preguntas configuradas, no a pasos rígidos.
5. Estados de carga, éxito y error accesibles y consistentes.
6. Movimiento sutil, con alternativa `prefers-reduced-motion`.

## Validación futura

Revisar en 360, 390, 768 y 1440 px; teclado completo; contraste AA; zoom 200%; estados vacíos/error y una invitación sin
RSVP.

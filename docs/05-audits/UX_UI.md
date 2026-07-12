# UX/UI Audit

## Estado

La invitación tiene una dirección visual coherente y cinco temas, pero la narrativa está fijada: hero, contador,
ornamento, vídeo, localización y CTA. No puede adaptarse al contenido real de una pareja sin editar JSX.

## Hallazgos

- El CTA de RSVP siempre aparece aunque la capacidad deba ser opcional.
- El formulario divide la tarea en pasos, pero sus preguntas y vocabulario son exclusivos de esta boda.
- El sistema usa iconos emoji en RSVP/Admin, lo que produce estilos variables por plataforma.
- Existen estilos globales útiles (`btn`, `card`, `input`), aunque hover y movimiento no documentan reducción de
  movimiento.
- Los temas modifican colores, fuentes, sombras, radios y fondos; es una base valiosa que debe preservarse.
- La jerarquía debe evaluarse prioritariamente en móvil, canal principal de acceso.

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


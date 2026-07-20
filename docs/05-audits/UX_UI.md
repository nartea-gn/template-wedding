# UX/UI Audit

## Estado actual

Landing, RSVP y Admin comparten tokens, iconografía, localización y comportamiento responsive. Royal conserva la
referencia visual aprobada y los cinco temas pueden variar composición, motion, superficies, ornamentos e iconos sin
cambiar contenido o funcionalidad.

La experiencia es coherente y funcional, pero la validación de release y una dirección artística más profunda son dos
trabajos distintos: el primero es obligatorio antes de `1.0.0`; el segundo debe continuar después con referencias y
comparaciones específicas por colección.

## Fortalezas verificadas

- Un único CTA principal por acción.
- RSVP usa una superficie visual y campos generados por configuración.
- Opciones agrupadas semánticamente y errores relacionados con sus controles.
- Selector de idioma compacto, no flotante y dependiente de configuración.
- Botones y controles táctiles mantienen una presencia consistente en móvil.
- Proveedores de mapas se presentan mediante popover o bottom sheet sin desplazar contenido.
- Vídeo ofrece poster, carga bajo demanda y fullscreen progresivo cuando el navegador lo admite.
- SVG propios evitan diferencias de emojis entre plataformas.
- Motion respeta `prefers-reduced-motion`.

## Validaciones obligatorias para release

| Prioridad | Área                 | Comprobación                                                                      |
|-----------|----------------------|-----------------------------------------------------------------------------------|
| P1        | Teclado y foco       | Orden lógico, `:focus-visible`, cierre de overlays y retorno del foco             |
| P1        | Formularios          | Labels, `name`, autocomplete cuando aplique, ayuda, errores y primer inválido     |
| P1        | Estados asíncronos   | Carga, éxito, error y refresco anunciados sin exponer errores del proveedor       |
| P1        | Responsive           | 320, 390, 768 y 1440 px sin overflow ni controles solapados                       |
| P1        | Localización         | ES/EN/BG, contenido largo, selector oculto y un único idioma                      |
| P1        | Accesibilidad visual | Contraste AA, zoom 200 %, reduced motion y estados no dependientes solo del color |
| P1        | Dispositivos         | Safari iOS, Chrome Android y navegadores de escritorio                            |
| P2        | Safe areas           | Bottom sheet, botones y overlays en dispositivos con barras/gestos                |
| P2        | Countdown            | Una línea y alianzas centradas a 320 px con todos los temas                       |

## Dirección artística posterior a 1.0.0

- Hacer que fotografía y relato sean el primer foco cuando el contenido real lo permita.
- Diferenciar colecciones mediante ritmo, encuadre, superficie y ornamento, no solo color.
- Mantener Royal sin regresiones y usarlo como referencia de fidelidad, no como plantilla estética para el resto.
- Investigar parejas tipográficas “redondas con vida” y comparar capturas antes de implementar cambios.
- Revisar las venue cards para reducir sensación de componente genérico cuando exista una propuesta visual aprobada.

Galería, Historia y Música permanecen aplazadas; no deben introducirse como excusa para resolver identidad visual.

## Principios de decisión

1. Una intención principal por sección.
2. Contenido y fotografía por encima del ornamento.
3. La configuración decide disponibilidad; la UI comunica el estado.
4. Botón para acciones y enlace para navegación.
5. Movimiento sutil y cancelable.
6. Contenido largo y traducciones forman parte del diseño, no son casos excepcionales.

## Evidencia pendiente

La aceptación final requiere una matriz registrada de tema × página × viewport × navegador. Una revisión parcial no se
presentará como validación completa.

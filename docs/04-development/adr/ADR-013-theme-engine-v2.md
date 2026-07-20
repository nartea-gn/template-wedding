# ADR-013 — Theme Engine v2

## Estado

Aceptado, implementado y validado.

## Contexto

El motor actual define colores, tipografías, sombras y radios en TypeScript, los convierte a Custom Properties y los
aplica desde `ThemeProvider`. Esta frontera funciona y mantiene el contenido declarativo, pero Sprint 6 ha confirmado
que varias decisiones de identidad siguen fijadas en CSS: ritmo editorial, motion, ornamentación, opacidad de
superficies y peso de iconos.

## Problema

Si esas decisiones permanecen locales, los temas solo cambian la paleta. Si se resuelven mediante variantes de
componentes o callbacks dentro del tema, el motor visual empezaría a controlar composición React y lógica de producto.
Necesitamos ampliar la identidad sin convertir el Theme Engine en un sistema de plugins.

## Alternativas consideradas

### Mantener el contrato actual

Es la opción más simple, pero obliga a duplicar selectores por `data-theme` y dispersa las decisiones que deben cambiar
de forma coordinada.

### Permitir componentes, callbacks o variantes arbitrarias en cada tema

Ofrece flexibilidad máxima, pero mezcla identidad con renderizado, dificulta el tipado y permite que una definición
visual termine alterando estructura o comportamiento.

### Ampliar el contrato con dimensiones semánticas y emitir CSS variables

Mantiene el flujo existente y permite que CSS siga siendo propietario del responsive. Solo se exponen decisiones con
consumidores reales y cada tema conserva una definición completa y explícita.

## Decisión

Adoptamos la tercera alternativa.

`ThemeDefinition` incorpora cinco grupos adicionales:

- `composition`: separación de secciones y anchos editoriales compartidos;
- `motion`: duración y distancia de reveal, y duración de interacción;
- `surfaces`: tratamiento relativo de cards;
- `decoration`: color y presencia de ornamentos;
- `iconography`: peso visual de los SVG propios.

`toCssVariables` es la única frontera que traduce el contrato TypeScript a CSS. Las variables v1 se preservan durante
la migración. `ThemeProvider` aplica el conjunto completo antes del pintado en el cliente y conserva `data-theme` para
patrones decorativos CSS.

## Dependencias permitidas

- El provider puede importar el registro y el convertidor de temas.
- CSS puede consumir las Custom Properties emitidas.
- La configuración de invitación solo referencia un `theme.id` válido.

## Dependencias prohibidas

- El Theme no contiene componentes React, funciones, textos ni assets de contenido.
- El Theme no activa capabilities, reordena secciones ni conoce bodas u otros tipos de evento.
- Los componentes no importan definiciones concretas como `royal` o `boho`.

## Consecuencias

- Los cinco temas requieren una definición más amplia, pero TypeScript detecta cualquier dimensión ausente.
- Las variaciones visuales se pueden introducir gradualmente sin cambiar el contrato de la invitación.
- El CSS responsive permanece junto a sus consumidores; el Theme aporta valores, no reglas de layout completas.
- `prefers-reduced-motion` continúa teniendo prioridad sobre cualquier valor del tema.

## No objetivos

- Herencia o composición profunda entre temas.
- Un editor visual o carga remota de temas.
- Variantes estructurales de Hero, Gallery o formularios.
- Implementar galería, historia o música.

## Estado de adopción

- Landing, RSVP, Admin y componentes compartidos consumen las dimensiones semánticas adoptadas.
- Royal declara explícitamente el stack serif histórico que antes dependía de un fallback implícito.
- Boho, Dark, Magnolia y Linen definen valores completos sin heredar de Royal ni copiar su identidad.
- Los anillos del countdown consumen el color de ornamento y se posicionan independientemente del ancho de las etiquetas.
- Las variables v1 permanecen disponibles durante la migración.

## Trabajo futuro

- Investigar y comparar tipografías por colección antes de cambiar fuentes.
- Medir carga selectiva y self-hosting antes de ampliar el contrato tipográfico.
- Mantener Galería, Historia y Música fuera del motor hasta que exista un caso de producto aprobado.

# Product Principles

## 1. La historia antes que la interfaz

La fotografía, el contenido y el evento tienen prioridad. Decoración y movimiento solo se aceptan cuando refuerzan comprensión o emoción.

## 2. Un foco por sección

Cada sección debe tener una intención principal. Si presenta varias acciones equivalentes, debe dividirse o establecer una jerarquía explícita.

## 3. La configuración describe el qué

Contenido, orden, tema y capacidades pertenecen a la definición de la invitación. Renderizado, validación, persistencia y navegación pertenecen al motor o a las features.

## 4. Opcional significa ausente

Una capacidad desactivada no debe dejar rutas, llamadas de red, CTA ni estados residuales. RSVP y Admin son capacidades, no requisitos universales.

## 5. Generalizar con evidencia

El primer caso se diseña con límites limpios, pero una abstracción nueva solo se incorpora cuando resuelve una segunda necesidad concreta o elimina un acoplamiento demostrado.

## 6. El Core desconoce el dominio

El Core conoce secciones, temas, formularios y navegación. No conoce ceremonia, banquete, boda, comunión ni reglas de negocio específicas.

## 7. La infraestructura es reemplazable

Una feature no importa Supabase ni detalles del hosting. Consume contratos; los adaptadores implementan esos contratos.

## 8. El sistema visual es la fuente de verdad

Color, tipografía, espaciado, radio, sombra y movimiento reutilizables se expresan mediante tokens. Las excepciones requieren intención local documentable.

## 9. Accesibilidad y movimiento responsable

La interacción debe funcionar con teclado, foco visible y semántica correcta. La experiencia respetará `prefers-reduced-motion` y nunca dependerá únicamente del color o de una animación.

## 10. Evolución siempre desplegable

Cada hito debe conservar una invitación funcional. Se migran piezas verticales completas y se elimina el legado cuando su sustituto está validado.


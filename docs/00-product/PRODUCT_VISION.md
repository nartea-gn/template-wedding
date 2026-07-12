# Product Vision

## Producto

Nartea Invitation Engine es un motor configurable para crear experiencias digitales de eventos. La invitación de boda
actual es su primer caso real, no el límite del producto.

## Problema

Las invitaciones digitales suelen mezclar contenido, diseño, comportamiento y almacenamiento en componentes específicos.
Cada nuevo cliente termina requiriendo cambios de código, lo que reduce consistencia, aumenta errores y dificulta
ofrecer nuevos tipos de evento.

## Propuesta de valor

Permitir crear una invitación distinta mediante datos y configuración: contenido, tema, orden de secciones y capacidades
opcionales. El motor conserva el comportamiento, la calidad visual, la accesibilidad y la integración técnica.

## Usuarios

- **Invitado:** necesita comprender rápidamente qué se celebra, cuándo, dónde y qué acción debe realizar.
- **Anfitrión:** necesita una experiencia que le represente y, cuando proceda, consultar respuestas.
- **Operador de NarteaGN:** necesita crear y mantener invitaciones sin modificar componentes del motor.
- **Desarrollador:** necesita contratos claros para añadir secciones, temas o adaptadores sin romper invitaciones
  existentes.

## North Star

Una persona con conocimientos básicos de TypeScript puede crear una invitación completa, reordenar sus secciones y
activar o desactivar capacidades sin modificar componentes del Core.

## Resultado emocional

La tecnología debe desaparecer para que la historia del evento sea protagonista. La experiencia debe transmitir calma,
cuidado, personalidad y confianza; nunca debe sentirse como una plantilla genérica o una demostración de efectos.

## Alcance de v1

- Invitación de boda como referencia funcional.
- Configuración tipada y declarativa.
- Secciones ordenables y capacidades opcionales.
- Sistema de temas basado en tokens.
- RSVP configurable con persistencia en Supabase.
- Admin básico opcional con la contraseña cliente actual.
- Despliegue estático compatible con GitHub Pages.
- Una o varias experiencias lingüísticas definidas por invitación.
- Selector de idioma opcional cuando exista más de un idioma.

## No objetivos de v1

- Editor visual o SaaS multiusuario.
- Autenticación robusta del Admin.
- SDK, CLI o marketplace de plugins.
- Monorepo con paquetes independientes.
- Generalización anticipada para todos los eventos posibles.

## Medidas de éxito

- Crear una variante de invitación no requiere editar el Core.
- Desactivar RSVP elimina CTA, ruta pública y Admin dependiente de respuestas.
- Todas las decisiones visuales reutilizables provienen del sistema de diseño.
- Build y lint permanecen sin errores ni warnings.
- La experiencia principal es usable en móvil, accesible y no depende de animación.
- Una invitación monolingüe no carga catálogos secundarios ni muestra controles innecesarios.
- Todo contenido visible, formularios y metadatos pueden localizarse sin modificar el Core.

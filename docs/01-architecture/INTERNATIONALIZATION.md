# Internationalization

## Objetivo

Cada invitación define qué idiomas admite, cuál es el predeterminado y si ofrece selector. El modo monolingüe debe ser
el camino más simple y ligero.

## Contrato conceptual

```ts
type LocalizationConfig<Locale extends string> = {
    defaultLocale: Locale
    supportedLocales: readonly Locale[]
    selector: {
        visible: boolean
    }
}
```

Los catálogos se mantienen fuera del Core y se registran por invitación. Los componentes de contenido usan claves
tipadas; los cargadores permanecerán en la composición de la aplicación para que la definición siga siendo serializable.

## Modos

### Un idioma

- `supportedLocales` contiene un elemento.
- Solo se importa su catálogo.
- No se renderiza selector, aunque `visible` se configure por error.
- No se persiste una preferencia innecesaria.

### Varios idiomas con selector

- Se carga primero `defaultLocale`.
- El selector es visible, accesible por teclado y anuncia el idioma activo.
- Los catálogos secundarios se importan al solicitarlos.
- La preferencia puede persistirse localmente para visitas posteriores.

### Varios idiomas sin selector

- La invitación usa el locale resuelto por configuración o entrada externa.
- No se expone control al invitado.
- No se realizará detección automática del navegador en v1 salvo decisión posterior.

## Resolución y fallback

1. Locale explícito y permitido.
2. Preferencia persistida, solo si la invitación ofrece varios idiomas.
3. `defaultLocale`.

Una clave ausente produce un diagnóstico en desarrollo. En producción puede recurrir al catálogo predeterminado, pero
nunca debe mostrar silenciosamente la clave técnica.

## Contenido cubierto

- Secciones y navegación.
- CTA, estados vacíos y mensajes de error.
- Preguntas, opciones y validaciones del Form Engine.
- Admin cuando se configure como localizable.
- Títulos, descripciones y metadatos SEO.
- Etiquetas de fecha, hora, cuenta atrás y localización.

## Fechas y formatos

Se usarán `Intl.DateTimeFormat`, `Intl.NumberFormat` y APIs equivalentes. El idioma controla el formato;
`event.timezone` controla la zona horaria. Los componentes no concatenan manualmente nombres de meses ni unidades.

## Accesibilidad

- Actualizar `document.documentElement.lang` al cambiar locale.
- El selector tendrá nombre accesible y estado actual reconocible.
- Cambiar idioma no desplazará el foco ni reiniciará formularios.
- Las etiquetas del selector usan nombres comprensibles para sus hablantes.

## Rendimiento

Los catálogos se dividirán por locale mediante imports dinámicos en Sprint 2.1. La primera invitación contiene
únicamente `es`, por lo que no incluye catálogos secundarios. No se añadirá una librería hasta comparar su coste y
funciones con las necesidades reales.

## Fuera de alcance inicial

- Traducción automática o generada en runtime.
- Gestión de traducciones desde un CMS.
- Negociación compleja mediante cabeceras del servidor en hosting estático.
- Variantes regionales automáticas no declaradas por la invitación.

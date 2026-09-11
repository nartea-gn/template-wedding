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

## Variables de contenido

Los catálogos no escriben los nombres de la pareja. Cada idioma declara su gramática alrededor de huecos
—`{partnerOne}`, `{partnerTwo}`, `{surnameOne}`, `{surnameTwo}`— y los valores llegan de una sola fuente:

```ts
'event.seoTitle': 'Invitación de boda de {partnerOne} y {partnerTwo}',
'gifts.account.holder': '{partnerOne} {surnameOne} y {partnerTwo} {surnameTwo}',
```

La sustitución ocurre **una vez al cargar cada catálogo** (`invitations/wedding/locales/variables.ts`), no dentro de
`t()`. Interpolar en `t()` habría pagado el coste en cada render y habría metido un vocabulario de esta boda —los
nombres de dos personas— dentro del runtime genérico de localización, que así no conoce la invitación que sirve.

Reglas del mecanismo:

- El hueco se lleva **el espacio que tiene delante**. Un apellido no declarado deja «Gala y Valentin», no
  «Gala  y Valentin »; después ningún `trim` podría distinguir ese espacio de uno que el idioma sí quería.
- Un hueco que no corresponde a ninguna variable se deja **literal**. Una errata tiene que verse en pantalla en
  lugar de resolverse en silencio a una cadena vacía.
- El conjunto de claves no cambia: es el que recorre la cadena de fallback.
- Los valores salen del entorno y admiten **override por idioma**, porque una variable no puede contener dos
  alfabetos: el búlgaro translitera («Ана») y el resto usa la grafía base. Sin override se usa la base, lo que mezcla
  alfabetos («Ана Ruiz и Бруно»); es preferible a un hueco, pero declara el override si publicas ese dato.
- `{partnerOneBase}` y `{partnerTwoBase}` **se saltan el override por idioma** y responden con la grafía que todos
  los idiomas comparten. Los escribe `event.hashtag`: un hashtag tiene que poder teclearse desde cualquier teclado y
  buscarse como una sola cadena, así que no se bifurca por alfabeto como sí hace la prosa.
- `locales/catalogs.test.ts` falla si un catálogo vuelve a llevar un nombre escrito a mano, y comprueba que los tres
  hashtags resuelven a lo declarado y en alfabeto latino. Es lo que impide que el mecanismo se deshaga solo.

Esto no contradice la política de no añadir librería: es sustitución posicional de un puñado de variables declaradas,
sin pluralización, formatos ni gestión remota.

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

Los catálogos secundarios se dividen por locale mediante imports dinámicos. La invitación actual usa español como
catálogo inicial y carga inglés o búlgaro cuando se solicitan. La interpolación que existe hoy es la
de «Variables de contenido», resuelta al cargar el catálogo y sin dependencias. No se añadirá una librería hasta que
pluralización, formatos por idioma o gestión remota justifiquen su coste y funciones.

## Fuera de alcance inicial

- Traducción automática o generada en runtime.
- Gestión de traducciones desde un CMS.
- Negociación compleja mediante cabeceras del servidor en hosting estático.
- Variantes regionales automáticas no declaradas por la invitación.

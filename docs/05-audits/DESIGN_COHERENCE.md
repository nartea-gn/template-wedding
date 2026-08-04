# Auditoría de coherencia y dirección visual

- **Sprint:** 6.6
- **Estado:** baseline visual cerrado y aprobado; QA integral transferido a Sprint 7.4
- **Rama de implementación:** `feature/design-coherence-audit`, integrada mediante PR #17
- **Rama de cierre:** `sprint/6.6.6-closeout`
- **Baseline:** Royal conserva la identidad aprobada de producción

## Resumen ejecutivo de cierre

La arquitectura visual y las fronteras de Theme Engine v2 quedan consolidadas. Royal fue restaurado y aprobado como
referencia; Boho, Dark, Magnolia y Linen disponen de paletas, tipografías, roles semánticos y familias de backgrounds
propias sin introducir lógica artística en el Core.

El sistema modular de apertura y cuerpo elimina estiramientos y costuras visibles en páginas de altura variable. Las
cinco colecciones se compararon en móvil y escritorio; Landing, RSVP y éxito heredan su identidad, mientras Admin
conserva una superficie operativa sin decoración ceremonial.

Sprint 6.6 cierra un baseline visual, no la dirección artística definitiva ni el QA de `1.0.0`. La evolución futura
puede profundizar fotografía, ritmo y tipografías propias, pero requiere decisiones aprobadas en Nartea Studio, medición
de carga y evidencia con contenido real.

Las validaciones de Admin autenticado, teclado, lector de pantalla, zoom al 200 %, dispositivos físicos y rendimiento
pertenecen al QA de Sprint 7.4. Su traslado no reduce el alcance del cierre visual ni debe interpretarse como evidencia
ya completada.

## Método y estado de evidencia

### Completado

- inventario de CSS, tokens, temas y propietarios;
- revisión de jerarquías y tamaños declarados;
- revisión estática de controles y semántica accesible;
- cálculo de contraste de los colores base de los cinco temas;
- revisión del orden de secciones, motion y carga tipográfica;
- comprobación de rama y baseline de trabajo.

### Validación visual completada

- Landing en 320 × 568, 390 × 844, 768 × 1024 y 1440 × 900;
- comparativa de Landing para Royal, Boho, Dark, Magnolia y Linen en móvil y escritorio;
- RSVP para los cinco temas en móvil y escritorio, con revalidación específica de Dark;
- acceso de Admin en 390 × 844;
- selector de idioma abierto en móvil;
- selector de aplicaciones de mapas abierto en móvil;
- comprobación de desbordamiento horizontal en móvil, tablet y escritorio;
- medición de tamaños computados de títulos, labels, botones, selector y countdown.
- continuidad modular de los fondos, incluida la corrección de la costura tonal de Linen;
- validación por producto de Royal y de la composición final;
- `pnpm lint` y `pnpm build` confirmados por producto sobre el trabajo integrado en PR #17.

El servidor local funcionó con las variables reales. Producto confirmó que `royal` es el baseline correcto; las
referencias externas no se consideran requisitos de cierre.

### Transferido a Sprint 7

- estados autenticados de Admin con respuestas reales;
- navegación manual completa con teclado, lector y zoom al 200 %;
- validación física en Safari iOS y Chrome Android;
- Lighthouse y Core Web Vitals;
- matriz final sobre un único release candidate;
- fotografías finales representativas cuando exista contenido de cliente.

### Estado de los hallazgos

La auditoría conserva los hallazgos originales como evidencia histórica. El cierre de Sprint 6.6 queda así:

| Hallazgo | Resultado                                                                                     | Estado           |
|----------|-----------------------------------------------------------------------------------------------|------------------|
| `DC-001` | Royal restaurado, validado en 320, 390, 768 y 1440 px y aprobado por producto.                | Cerrado          |
| `DC-002` | Roles funcionales y contraste estático AA para los cinco temas; comparativa visual completada. | Cerrado          |
| `DC-003` | Countdown recompuesto y validado en ES, EN y BG sin overflow.                                 | Cerrado          |
| `DC-010` | Superficies de éxito/error por tema; RSVP y Dark revalidados. Admin real pasa a Sprint 7.4.   | Baseline cerrado |
| `DC-015` | Contenido esencial visible en primer render y fallback global de reduced motion presente.     | Baseline cerrado |
| `DC-017` | Cinco familias responsive con apertura y cuerpo modular continuo, incluida corrección Linen.  | Cerrado          |
| `DC-018` | `primary` no alcanza AA como texto pequeño en Boho y Magnolia; requiere una decisión de rol.   | Abierto · Sprint 7.4 |

`Baseline cerrado` significa que la implementación de Sprint 6 cumple su objetivo; no sustituye las pruebas integrales
del release candidate.

Contraste estático de los nuevos pares declarados en `themes.ts`:

| Tema     | Acción/texto | Borde/control sobre fondo | Éxito/superficie | Error/superficie |
|----------|-------------:|--------------------------:|-----------------:|-----------------:|
| Royal    |      11,27:1 |                    5,04:1 |           5,43:1 |           5,97:1 |
| Boho     |       5,96:1 |                    5,06:1 |           5,87:1 |           6,28:1 |
| Dark     |       8,50:1 |                    4,34:1 |           6,85:1 |           6,88:1 |
| Magnolia |       6,10:1 |                    5,25:1 |           5,29:1 |           6,03:1 |
| Linen    |       8,05:1 |                    5,44:1 |           5,82:1 |           6,25:1 |

Los pares de texto superan 4,5:1. Los bordes de control superan el mínimo no textual de 3:1; su validación final debe
realizarse también sobre las superficies reales donde aparezcan, no solo sobre el fondo base.

### DC-018 — El color artístico `primary` no es un rol de texto accesible en todas las colecciones

- **Evidencia actual:** `primary/background` mide 2,74:1 en Boho y 3,54:1 en Magnolia; `primary/surface` mide 2,49:1 y
  3,16:1 respectivamente.
- **Impacto:** `primary` funciona como acento artístico, pero no puede garantizar WCAG AA cuando se reutiliza en texto
  pequeño de badges, metadatos o tablas.
- **Límite:** los roles inequívocamente funcionales (`text`, `onAction`, `success`, `danger` y `controlBorder`) sí están
  protegidos por pruebas automáticas. Este hallazgo no invalida los fondos ni las paletas aprobadas.
- **Decisión pendiente:** comparar dos rutas antes de modificar diseño: oscurecer `primary` en Boho y Magnolia, o
  conservarlo como acento y añadir un rol semántico accesible específico para texto de énfasis. La segunda opción evita
  degradar la dirección artística, pero amplía deliberadamente el contrato del tema.

## Hallazgos originales

Las secciones DC-001–DC-017 conservan el diagnóstico previo a la implementación. Sus rutas, cifras y recomendaciones
describen el estado auditado en ese momento; la tabla **Estado de los hallazgos** y el scorecard de cierre son la
autoridad sobre el resultado actual.

### Prioridad original P0

### DC-001 — La invitación activa no usa Royal

- **Evidencia:** `src/invitations/wedding/invitation.ts:17` declara `theme.id: 'magnolia'`.
- **Impacto:** la invitación de referencia y las pruebas manuales parten de una colección distinta a la que producto
  pidió preservar.
- **Causa:** cambio temporal de tema conservado al integrar la rama.
- **Recomendación:** confirmar la intención y restaurar `royal` en el incremento 6.6.1 si no existe una decisión nueva.
- **Propietario:** configuración de Invitation, no Theme Engine.

### DC-002 — El contrato no garantiza contraste de acciones y controles

Contraste calculado sobre los colores base:

| Tema     | Texto/fondo | Primary/fondo | Muted/fondo | Border/fondo |
|----------|------------:|--------------:|------------:|-------------:|
| Royal    |       14,75 |         10,69 |        4,59 |         2,17 |
| Boho     |        9,83 |      **2,74** |    **3,92** |     **1,48** |
| Dark     |       16,15 |          8,50 |        7,66 |     **1,43** |
| Magnolia |       13,71 |      **3,54** |    **4,19** |     **2,19** |
| Linen    |       12,79 |          7,66 |        4,74 |     **1,61** |

- **Evidencia:** `src/design/themes/themes.ts`; `.btn--primary` utiliza `primary` sobre `background` y `.input` usa
  `border` sobre `background` en `src/index.css:207-217` y `247-277`.
- **Impacto:** Boho falla incluso el umbral de texto grande en la acción primaria; Magnolia no alcanza texto normal; los
  bordes no aseguran contraste de componente. Las numerosas opacidades del 40–75 % reducen aún más la legibilidad.
- **Causa:** el contrato solo define colores de marca, no roles `onPrimary`, `controlBorder`, `success`, `danger` o
  estados interactivos.
- **Recomendación:** diseñar roles semánticos mínimos y validar combinaciones generadas; no oscurecer colores aislados
  dentro de componentes.
- **Propietario:** Theme Definition y consumidores compartidos.

### DC-003 — El countdown sacrifica legibilidad para conservar una sola línea

- **Evidencia:** `src/pages/Landing.css:386` baja labels a `0.52rem` y `:403` a `0.48rem`.
- **Impacto:** etiquetas de aproximadamente 8,3 y 7,7 px son difíciles de leer, especialmente en BG, zoom y pantallas
  con baja densidad o visión reducida.
- **Causa:** la solución responsive comprime tipografía y tracking en vez de reservar ancho mediante una composición
  estable.
- **Recomendación:** mantener una línea sin reducir labels por debajo de la escala de caption aprobada; estudiar números
  tabulares, columnas flexibles, abreviaturas localizadas o separación proporcional.
- **Propietario:** Countdown layout y escala tipográfica, no cada tema.

### Prioridad original P1

### DC-004 — No existe una escala tipográfica compartida completa

- Botones: `0.8125rem` con tracking `0.14em`.
- Labels: `0.8125rem`.
- Selector de idioma: `0.78rem`; códigos/opciones auxiliares bajan a `0.7–0.72rem`.
- Badge de mapas: `0.58rem`.
- Paginación móvil: `0.7rem`.
- Venue type y countdown labels usan tamaños locales adicionales.

**Impacto:** la interfaz se percibe pequeña y cada componente resuelve legibilidad por separado. El tracking uppercase
amplifica el ancho sin mejorar lectura en todos los idiomas.

**Recomendación:** definir roles tipográficos (`display`, `sectionTitle`, `body`, `label`, `button`, `caption`,
`metric`) con mínimos responsive y validar ES/EN/BG antes de migrar consumidores.

### DC-005 — Todos los temas descargan todas las fuentes

- **Evidencia:** `index.html:9` solicita Cormorant Garamond, Josefin Sans, Lato, Montserrat, Niconne, Nunito, Playfair
  Display y Raleway en una única URL.
- **Impacto:** coste de red y privacidad para familias que el tema activo no utiliza; la tipografía se convierte en una
  lista de recursos y no en una decisión de colección.
- **Recomendación:** investigar parejas por colección y, después de medir, cargar únicamente la pareja activa o
  self-hostear los subconjuntos necesarios. No cambiar fuentes durante la optimización.

### DC-006 — La Landing es coherente, pero aún se siente como una plantilla centrada

- **Evidencia:** `.landing-page` aplica gutters y centrado global; Hero solo contiene texto; vídeo y venues se presentan
  como superficies acotadas; las venue cards repiten el patrón card.
- **Impacto:** nombres y contenido son claros, pero falta una imagen dominante o composición memorable en el primer
  viewport. El tratamiento premium depende más de tipografía y espacio que de narrativa visual.
- **Recomendación:** evaluar una dirección image-led o editorial con un único ancla dominante. Es P2 hasta comparar la
  referencia visual y el contenido fotográfico real.

### DC-007 — El motion no sigue el orden narrativo real

- **Evidencia:** el array renderiza Hero → Countdown → Vídeo → Venue → CTA, pero los delays CSS son Hero 0, Countdown
  0,4 s, Vídeo 0,2 s, Venue 0,3 s y CTA 0,5 s.
- **Impacto:** la secuencia de entrada no coincide con el orden de lectura. Las secciones inferiores se animan al cargar
  el documento, no al entrar en viewport.
- **Recomendación:** una entrada coordinada para Hero y revelado de secciones al aproximarse al viewport, sin animar
  contenido que el usuario todavía no ve. Mantener reduced motion como autoridad superior.

### DC-008 — El selector de idioma usa semántica de menú sin interacción completa de menú

- **Evidencia:** `LanguageSelector.tsx:68-89` usa `role="menu"` y `menuitemradio`, pero no implementa roving focus ni
  navegación con flechas. El trigger mide `2.5rem` de alto.
- **Impacto:** patrón inesperado para teclado y objetivo táctil inferior al mínimo recomendado de la auditoría.
- **Recomendación:** convertirlo en popover/listbox apropiado o completar el patrón de menú; garantizar 44 px mínimos,
  foco inicial/retorno y cierre consistente.
- **Estado actual:** la semántica de menú ya dispone de foco inicial, flechas, Inicio/Fin, Escape y retorno al trigger.
  La altura táctil de 44 px y la composición móvil se mantienen como revisiones separadas.

### DC-009 — El viewport móvil sigue dependiendo de `100vh`

- **Evidencia:** `body`, `.rsvp-page` y `.rsvp-success-page` usan `100vh`/`min-h-screen`.
- **Impacto:** barras dinámicas de Safari/Chrome pueden crear espacio extra o centrar mal formularios y estados.
- **Recomendación:** fallback `100vh` seguido de `100svh`/`100dvh` donde corresponda y validar con teclado virtual.

### DC-010 — Estados semánticos no pertenecen al tema

- **Evidencia:** RSVP y StatsCards usan verdes y rojos Tailwind hardcodeados; el Theme Definition no define success,
  danger ni sus superficies.
- **Impacto:** contraste y armonía pueden fallar especialmente en Dark, Magnolia y Boho.
- **Recomendación:** roles semánticos compartidos con contraste verificado; el significado no cambia por tema, pero su
  representación accesible sí puede adaptarse.
- **Estado actual:** implementado en la rama mediante roles por tema; pendiente de validar en escenarios reales. El
  nombre técnico `danger` actúa hoy como compatibilidad para `error` y deberá separarse antes de representar acciones
  destructivas.

### DC-011 — El botón global añade una firma visual demasiado dominante

- **Evidencia:** todos los `.btn` comparten cápsula completa, brillo que cruza, elevación en hover y escala/traslación
  en active (`src/index.css:139-205`).
- **Impacto:** acciones de Landing y utilidades de Admin comparten un gesto ornamental; en Admin compite con la densidad
  operativa y puede sentirse genérico.
- **Recomendación:** conservar una base accesible y diferenciar CTA ceremonial de botones operativos mediante roles
  explícitos, no selectores por página.

### DC-012 — Admin mantiene un mosaico de cards informativas

- **Evidencia:** `StatsCards.tsx:32-47` renderiza cuatro `.card`; toolbar y tabla añaden superficies propias.
- **Impacto:** el panel es legible, pero distribuye atención entre contenedores equivalentes en lugar de priorizar
  resumen, controles y datos.
- **Recomendación:** comparar un KPI strip con divisores y menos chrome. No eliminar cards antes de revisar la captura
  real y la densidad móvil.

### DC-013 — Falta declarar `color-scheme` para Dark

- **Evidencia:** no existe `color-scheme` en CSS ni metadata dependiente del tema.
- **Impacto:** controles nativos, opciones de select, scrollbars y UI del navegador pueden no armonizar con Dark.
- **Recomendación:** añadir un rol o metadata de esquema cromático al tema y aplicarlo en el documento después de probar
  Safari, Chrome y formularios nativos.

### DC-014 — Hay pequeñas deudas de robustez y propiedad

- Los botones de cabecera Admin y CTA no declaran siempre `type="button"`; hoy están fuera de forms, pero el contrato es
  frágil ante recomposición.
- El foco global impone `border-radius: 4px` a cualquier elemento.
- Patrones decorativos contienen colores RGB históricos en lugar de derivarse completamente del contrato.
- Google/Apple necesitan fondo blanco por marca; esta excepción debe quedar documentada y no convertirse en un token de
  tema.

### DC-015 — La entrada inicial puede mostrar un primer viewport casi vacío

- **Evidencia visual:** inmediatamente después de recargar, Hero y contenido principal parten de `opacity: 0`; tras la
  animación la composición aparece correctamente.
- **Impacto:** conexiones lentas, capturas automáticas y usuarios sensibles a la espera pueden percibir un flash vacío
  antes de entender la invitación.
- **Recomendación:** mantener el contenido esencial visible en el primer render y animar transform/opacidad de forma
  progresiva solo cuando el entorno lo permita. La narrativa no debe depender de que termine una animación.

### DC-016 — El selector de idioma tapa el título en móvil

- **Evidencia visual:** a 390 px el menú de 168 × 133 px se abre desde la esquina superior derecha sobre el nombre de la
  pareja; el foco permanece en el trigger.
- **Impacto:** la utilidad compite con el principal punto emocional del Hero y la semántica de menú incompleta se hace
  visible también como problema de composición.
- **Recomendación:** conservar el trigger fijo en el flujo visual acordado, pero abrir una superficie que no cubra el
  título —por ejemplo, popover alineado bajo una cabecera reservada o sheet compacto en móvil— y completar gestión de
  foco y teclado.
- **Estado actual:** la gestión de foco y teclado está completada; la superposición visual sobre el Hero continúa
  abierta y requiere una decisión compositiva antes de modificar el diseño aprobado.

### DC-017 — Los patrones iniciales no alcanzaban la dirección artística propuesta

- **Evidencia inicial:** `src/themes/patterns.css` solo combinaba gradientes y tramas CSS de baja intensidad. Los mocks
  propuestos usan papel/acuarela, arte botánico periférico y continuidad visual entre secciones.
- **Impacto:** los temas cambian color, tipografía y matices, pero no crean una atmósfera suficientemente reconocible;
  Landing sigue percibiéndose como una plantilla centrada.
- **Recomendación:** introducir backgrounds artísticos por colección siguiendo
  [`BACKGROUNDS.md`](../02-design/BACKGROUNDS.md). La primera versión debe reutilizar `data-theme` y CSS responsive, sin
  ampliar el Core ni insertar rutas de decoración en Invitation Definition.
- **Propietario:** presentación visual del tema y assets de diseño; no contenido ni Section Registry.
- **Estado actual:** implementado en la rama con tres aperturas y tres módulos de cuerpo por colección. Royal validó el
  patrón modular y este se propagó a Boho, Dark, Magnolia y Linen. La comparativa visual se completó en móvil y
  escritorio; Linen recibió una extensión especular para eliminar su costura tonal. RSVP y éxito mantienen una única
  imagen estable y Dark se revalidó como caso de mayor contraste.

## Evidencia visual transversal

### Landing

- No presenta desbordamiento horizontal en 320, 390, 768 ni 1440 px.
- En 1440 px los nombres dominan correctamente, pero la primera fotografía/vídeo queda por debajo del viewport y hay
  mucho espacio sin contenido visual protagonista.
- En 320 y 390 px la composición conserva una sola línea de countdown, a costa de labels computados entre 7,68 y 8,32
  px.
- **Revalidación 6.6.1:** los labels pasan a 10 px en 320, 10,14 px en 390 y 12 px desde tablet; no existe overflow en
  ES, EN o BG y los separadores quedan centrados a 1–2 px respecto de las cifras.
- En 768 y 1440 px el countdown utiliza un ancho máximo estable de 672 px y conserva la jerarquía histórica de Royal.

### RSVP

- La tarjeta y los campos mantienen ritmo estable en móvil y escritorio, sin solapamientos ni overflow.
- Los controles alcanzan aproximadamente 48 px, pero labels y acciones permanecen en torno a 13 px; la mejora debe venir
  de la escala tipográfica compartida, no de excepciones locales.

### Admin

- La pantalla de acceso es coherente y táctilmente suficiente en móvil.
- El dashboard autenticado queda fuera de la evidencia visual de esta sesión; sus hallazgos se apoyan todavía en la
  revisión estática y en capturas anteriores, por lo que no debe rediseñarse sin una captura actual con datos reales.

### Mapas

- El selector móvil es uno de los patrones más sólidos actuales: dialog correcto, foco inicial, acciones de 60–63 px,
  jerarquía clara y enlaces específicos para opción automática, Google Maps y Apple Maps.
- **Revalidación Sprint 7.4:** las tres opciones quedan completas dentro del viewport en 320 × 568, 360 × 740 y
  390 × 844 px; la hoja inferior usa viewport dinámico, áreas seguras y contención de overscroll. El popover de
  escritorio conserva las tres opciones en 1440 × 900 px.
- Debe conservarse como referencia de interacción móvil durante la revisión del selector de idioma.

## Scorecard de cierre por tema

| Tema     | Identidad                    | Contraste base        | Tipografía                | Diferenciación estructural | Estado            |
|----------|------------------------------|-----------------------|---------------------------|----------------------------|-------------------|
| Royal    | Referencia clásica/editorial | AA en roles definidos | Serif histórica + Josefin | Fondo modular Royal        | Aprobado          |
| Boho     | Cálida, orgánica             | AA en roles definidos | Cormorant + Nunito        | Fondo botánico modular     | Baseline aprobado |
| Dark     | Nocturna, lujo contrastado   | AA en roles definidos | Cormorant + Lato          | Fondo celestial modular    | Baseline aprobado |
| Magnolia | Romántica, suave             | AA en roles definidos | Cormorant + Raleway       | Fondo floral modular       | Baseline aprobado |
| Linen    | Sobria, natural              | AA en roles definidos | Playfair + Montserrat     | Fondo botánico modular     | Baseline aprobado |

Las familias tipográficas actuales permanecen como baseline. Una sustitución por tipografías “redondas con vida” o
fuentes propias requiere aprobación en Nartea Studio y una estrategia de carga medida.

## Propiedad técnica recomendada

| Decisión                                | Propietario                 |
|-----------------------------------------|-----------------------------|
| Escala tipográfica, altura mínima, foco | Design System global        |
| Colores y roles semánticos              | Theme Definition            |
| Layout responsive interno               | CSS del componente          |
| Orden y disponibilidad                  | Invitation Definition       |
| Composición narrativa de Landing        | Página + Section Registry   |
| Contenido y traducciones                | Paquete de invitación       |
| Estados de datos                        | Feature/Repository, no tema |

## Incrementos completados

1. **6.6.1 — P0:** tema activo, contraste y countdown legible.
2. **6.6.2 — Sistema:** escala tipográfica, roles de control y touch targets.
3. **6.6.3 — Landing y backgrounds:** hero, narrativa, motion, fondos por colección y necesidad real de cards.
4. **6.6.4 — RSVP:** ritmo, campos, progreso, errores y acciones.
5. **6.6.5 — Admin:** KPIs, toolbar, tabla y densidad.
6. **6.6.6 — Colecciones:** dirección artística y tipografía investigada por tema.

## Cierre y continuidad

Sprint 6.6 queda cerrado como baseline visual y técnico. Las puertas restantes se gestionan mediante
[`SPRINT_7_PLAN.md`](../00-product/SPRINT_7_PLAN.md) y
[`RELEASE_CHECKLIST.md`](../04-development/RELEASE_CHECKLIST.md).

La evolución artística posterior se mantiene en backlog y no debe mezclarse con seguridad, contratos o QA de la release.

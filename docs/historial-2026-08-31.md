# Historial de commits — cierre del 31 de agosto de 2026

Este documento existe porque el historial local de `producto-web` se va a borrar. El repositorio
nunca tuvo remoto, así que una vez borrado no queda ninguna copia de los commits en ningún sitio:
esta es la única constancia que sobrevive. Recoge los 15 commits del repositorio, en orden
cronológico, con el hash corto de cada uno (para que las referencias que ya existen en otros
documentos — incluidos los de `proyecto-web` — sigan apuntando a algo reconocible) y, sobre todo,
el razonamiento que llevaba cada cuerpo de commit: qué se decidió no hacer, qué caveats deja
escritos y qué queda todavía sin verificar.

Este documento complementa a [`CIERRE_REVIEW.md`](./CIERRE_REVIEW.md), que ya recoge el estado de
los 38 ítems del review por ítem. Aquí el orden es por commit, no por ítem, precisamente para
conservar el hash corto y el razonamiento tal y como aparecía en cada entrega.

Los asuntos (`subject`) de los commits están en inglés, como manda la convención del repositorio;
el resto de este documento está en español.

- **`a87aaff`** — `chore: baseline before review fixes`. Punto de partida antes de aplicar las
  correcciones del review. Sin cuerpo.

## Type-check real y sus 25 errores

- **`367ae9f`** — `fix: make the type-check step real and clear its 25 errors`. El build ejecutaba
  `tsc` a secas contra un `tsconfig.json` de tipo *solution* (`"files": []` más `references`), que
  no comprueba nada. Cambiar a `tsc -b` sacó a la luz 25 errores preexistentes, corregidos aquí:
  `RsvpRecordUpdate` sustituye a un `Pick<>` sobre nombres de columna en `snake_case` que no
  existen en el registro de dominio en `camelCase` (6 sitios); `adminRsvpActions` importaba desde
  una ruta un nivel más profundo de lo correcto; `SupabaseRsvpRepository` tenía una importación de
  tipo que faltaba y una propiedad de parámetro de constructor rechazada por
  `erasableSyntaxOnly`; `EditResponseModal` pasa a recibir `FormDefinition` en vez de un duplicado
  estructural, mantiene `answers` como `FormAnswers` y separa las referencias de input y textarea,
  además de añadir la trampa de foco en `Tab` que `aria-modal` ya prometía sin cumplir; `Admin`
  resuelve el método de autenticación mediante un helper anotado para que las ramas de contraseña
  y OTP sigan siendo alcanzables; `buildResponsesJson` recibe `booleanLabels` igual que ya hacía el
  constructor de CSV; el modal de edición **ahora cierra solo si el guardado confirma**, en vez de
  cerrarse ante un guardado fallido y descartar lo tecleado; y `common.close` se añade a los
  catálogos es, en y bg, con la superficie del modal usando el token del tema en vez de blanco
  hardcodeado.

## Purga real, cierre del RSVP a nivel de API, y consentimiento de datos de salud

- **`46797e8`** — `feat: purge RSVP data for real and close the RSVP at the API`. Retención y
  cierre eran, hasta este commit, solo de interfaz: la base de datos no sabía nada de la boda, así
  que no podía imponer ninguna de las dos cosas.
  - **Purga** (review 8.1, 8.4, 8.5): nueva tabla `invitations` con la fecha de boda, escrita por
    el pipeline de despliegue. Un job nocturno de `pg_cron` purga cada boda que ha superado su
    ventana de siete días, en vez de un RPC de cliente que fallaba por permisos y solo corría
    cuando un administrador abría el panel. `retained_until` y `purgeExpired` desaparecen de las
    seis capas que los referenciaban, y con ellos el segundo `useEffect` del panel de admin, lo
    que también elimina la doble consulta concurrente del hallazgo 2.2. Una Edge Function avisa a
    los administradores por correo antes del borrado, y solo marca una boda como avisada si se
    aceptaron todas las direcciones.
  - **Cierre** (review 12.1, 12.1.1): `rsvp_deadline_utc` y `rsvp_override` viven junto a la fecha
    de boda; `is_rsvp_open` filtra el `INSERT` anónimo, y la pareja mueve ambos desde el panel sin
    redespliegue. La ruta de RSVP **se registra siempre**, de modo que un enlace guardado en
    marcadores llega a la página de «plazo terminado» en vez de a «ruta no encontrada»; el panel
    nunca se condiciona al estado en vivo. El estado se revalida una vez por visita y **falla en
    abierto**: si la base de datos no responde, se mantiene el plazo compilado, porque la
    autoridad real es la policy del `INSERT`. Un rechazo `42501` muestra el mensaje de cierre en
    vez de un error de envío genérico.
  - **Policies** (review 1.2, 1.3): las dos policies PERMISSIVE de `UPDATE` se reducen a una. La
    autoría del borrado pasa a un trigger, de modo que cualquier administrador puede borrar o
    restaurar pero nadie elige de quién queda el nombre en la fila. Un trigger deriva las columnas
    planas a partir de `answers` en cada escritura.
  - **Repositorio genérico** (review 2.3): los identificadores de campo de la boda salen de la
    capa de infraestructura y pasan a la invitación que los define, para que un formulario con
    identificadores distintos deje de romper las restricciones de la tabla.
  - **Todo paso que toca un servicio externo queda documentado y sin ejecutar** en
    `docs/PURGE_DEPLOYMENT.md`.

## Privacidad y consentimiento de datos de salud

- **`fb87300`** — `feat: tell guests how their data is handled, and ask before collecting health
  data`. Se pedían alergias a los invitados —datos de salud del artículo 9— sin base legal alguna
  y sin ninguna información sobre quién procesa esos datos. **Es la única parte del review que
  afecta a terceros que no firmaron nada.**
  - `InvitationDefinition` incorpora un `controller` obligatorio: el artículo 13 exige la
    identidad y los datos de contacto del responsable del tratamiento, y la pareja no figuraba en
    ningún sitio del contrato. Una invitación que no puede nombrar uno deja de compilar.
  - El formulario de RSVP declara su aviso de privacidad, así que se muestra en todos los pasos.
    El nombre y la dirección del responsable se sustituyen en la página, dejando intacto el
    contrato de localización `t(key)`.
  - Las respuestas de dieta quedan detrás de una pregunta explícita de consentimiento. Elegir es
    obligatorio; consentir no lo es, así que «prefiero no decirlo» envía el formulario y deja
    constancia de la negativa.
  - La versión del formulario sube a 2, porque la versión almacenada es lo que demuestra qué texto
    aceptó cada invitado.
  - El panel avisa a la pareja de que esas respuestas llevan datos de salud.
  - **Corrige un defecto que el review solo sospechaba**: los campos ocultos conservaban su valor
    en `answers` y se enviaban igualmente. Un invitado que rellenaba alergias y luego revocaba el
    consentimiento las seguía enviando. El envío ahora usa solo las respuestas visibles.
  - También retira una clave `rsvp.privacy.notice` que existía en los tres catálogos sin estar
    cableada a ningún formulario.

## Cuenta atrás, landmarks, rendimiento y accesibilidad

- **`05f3166`** — `feat: celebrate the wedding day, fix the landmarks and stop shipping unused
  work`.
  - **Cuenta atrás** (consultas-producto 1, que sustituye a los hallazgos 5.3 y 5.4 del review):
    tres estados en vez de una sección que desaparece: cuenta, dice «hoy es el gran día» y luego
    se oculta. «Hoy» empieza en el instante de la ceremonia, de modo que el reloj se ve llegar a
    cero, y termina cuando cierra el día natural **en el huso horario de la boda** — un invitado
    en Argentina no debe leer «hoy» cuando en Madrid ya es mañana. El temporizador solo cuenta
    mientras está pendiente, y se retira el `aria-live` redundante: `role="timer"` ya lleva la
    semántica, y anunciar cada segundo hacía la página inusable con lector de pantalla.
  - **Landmarks y maquetación** (review 3): tres elementos `<main>` anidados se colapsan al único
    que apunta el skip link. La tarjeta de vídeo estaba anclada a la izquierda en tablet y
    escritorio porque el wrapper de más era un bloque simple; al quitarlo, la tarjeta se centra
    sin ningún cambio de CSS.
  - **Rendimiento** (review 4): cada visita descargaba las ocho familias tipográficas de los cinco
    temas y usaba solo una. Ahora cada tema declara las familias que necesita y el build inyecta
    solo las del tema activo, así que activar un tema nunca puede dejar la página pidiendo las
    fuentes de otro.
  - **Accesibilidad** (review 5.5 a 5.10): el foco se mueve al vídeo en vez de caer al `<body>`
    cuando el botón de reproducir se desmonta, y el modo de pantalla completa solo se pide donde
    el navegador realmente lo necesita, no en todos los dispositivos. `Tab` cierra el menú de
    idioma y el popover del mapa de escritorio en vez de quedar atrapado dentro de ellos —la
    trampa de foco se reserva para lo que de verdad es modal—. El selector de idioma pasa a un
    landmark de cabecera, y el color previo a la hidratación coincide con el del tema `royal`.
  - **Código muerto** (review 6): tokens de radio, sombra de foco y tipografía estaban exportados
    y nunca consumidos, y duplicados a mano en `index.css`. Ahora se consumen como variables CSS y
    los literales desaparecen. Se eliminan tres variables CSS muertas, una duplicación exacta de
    una función de la aplicación, reglas CSS sin uso, un tipo redeclarado y un mensaje de error en
    español suelto entre el resto en inglés. `setLocale` deja de depender del `locale` que él mismo
    fija, lo que disparaba de nuevo el efecto que restaura el idioma persistido. Un test nuevo ata
    `patterns.css` a la lista de temas: renombrar un tema antes compilaba limpio y perdía su fondo
    en silencio.

## Dos temas nuevos y el fin de las respuestas duplicadas

- **`3b7af2d`** — `feat: add the lavender and terracotta themes, and stop duplicate RSVP rows`.
  - **Temas** (review 10.3): las dos entradas siguen las convenciones que ya codifican los cinco
    existentes: triples RGB derivados de su hexadecimal, sombras teñidas desde `primary`,
    agrupados por carácter —lavender orgánico junto a magnolia y boho, terracotta editorial junto
    a linen—. Los diez checks de contraste pasan. Declaran sus propios `googleFonts`: el review
    sugería una lista vacía razonando que ninguno necesita una familia *nueva*, pero con la
    inyección de fuentes por tema, una lista vacía significa que el tema se despliega **sin
    ninguna** tipografía web propia — justo la regresión silenciosa que ese cambio pretendía
    evitar. **Ambos declaran un bloque `patterns.css` sin arte propio**: las ilustraciones son un
    encargo de diseño, y un fondo plano explícito es una elección, no un olvido. *(Nota: este
    estado quedó superado el mismo día por `452c336`, más abajo — ver la sección «El fondo de los
    temas nuevos: la discrepancia resuelta» al final de este documento.)*
  - **Respuestas duplicadas** (review 10.2): un invitado que corregía su respuesta creaba una
    segunda fila, lo que falseaba en silencio el recuento de comensales entregado al catering. Un
    índice de identidad normalizado más un trigger redirige un envío repetido hacia la fila
    existente. El review recomendaba un `upsert` desde el navegador, que habría exigido conceder
    `UPDATE` anónimo sobre la tabla — permitiendo a cualquiera sobrescribir la respuesta de otro
    adivinando su nombre. El trigger logra el mismo resultado sin conceder ese privilegio. A los
    invitados se les pide reutilizar el mismo nombre, porque sin un token por invitado el nombre
    es el único identificador disponible; los homónimos siguen compartiendo fila, y eso queda
    documentado en la propia migración.
  - **Fallos por fila** (review 12.2): un borrado o una restauración fallidos ya no sustituyen
    toda la tabla por un aviso de carga fallida general; el error se muestra en la fila a la que
    pertenece.
  - **Registro de secciones** (review 2.4): la premisa estaba obsoleta — `SectionRegistry` ya es
    un *mapped type* y una entrada cruzada no compila, verificado. El casteo de ensanchamiento del
    renderer se estrecha para afirmar solo lo que ese tipo ya garantiza.

## Alojamiento, historia y cobertura de test

- **`0bfc0c7`** — `feat: add the lodging and story sections, and close the named test gaps`. Las
  dos secciones se anunciaban en la landing y no existían en el motor.
  - **Alojamiento** (review 11.1): lugares donde alojarse con enlace a la página de reserva de
    cada uno. El precio es una franja con etiquetas de catálogo en vez de una cifra que caduca con
    la temporada, y no hay campo de distancia: se pudre en cuanto cambia el lugar y nadie lo
    revalida. Los enlaces de reserva anuncian que abren una pestaña nueva — el motor ya abría así
    todos los enlaces externos y nunca lo decía.
  - **Historia** (review 11.2): prosa libre como un array de claves de catálogo, una por párrafo.
    El número de bloques es decisión estructural de la pareja; la prosa dentro de cada clave no
    tiene restricciones. **Limitación conocida, documentada en el ADR**: todos los idiomas
    comparten el mismo número de párrafos. Una imagen exige texto alternativo, impuesto por
    validación.
  - Ambas secciones usan un `h2` real con `aria-labelledby` en vez del párrafo con estilo que las
    secciones más antiguas usan como titular, así que la página por fin tiene algo navegable por
    debajo del hero.
  - **ADR-019 registra estas decisiones. ADR-007 se deja intacto a propósito**: documenta por qué
    el contrato tenía cinco secciones en su momento, y editarlo *in situ* borraría ese registro.
  - **Cobertura de test** (review 7): la validación de secciones cubre ahora hero, cuenta atrás,
    vídeo, identificadores de elementos de `venue`, y las dos secciones nuevas. La validación de
    formulario cubre las ramas de `minLength` y email. `useRsvpAvailability` cubre la cadena de
    reprogramación de plazo largo y el estado en vivo sobreescribiendo el plazo compilado en ambas
    direcciones — el caso que da sentido a todo el diseño de cierre.

## Sección de regalos y arnés de migraciones

- **`fa67c63`** — `feat: add the gifts section and a local harness that actually runs the
  migrations`.
  - **Regalos** (review 9.2 y 9.3): una sección con enlace a lista de regalos, datos bancarios, o
    ambos. IBAN y Bizum son configuración, así que nada llega a la base de datos y no hay
    migración ni policy de por medio. **Las tres mitigaciones se entregan juntas, no como
    opciones**: los datos bancarios quedan fuera del HTML inicial hasta que un invitado los pide,
    la invitación se marca `noindex`, y una línea de aviso acompaña a los datos. Un número de
    Bizum es un teléfono personal, y publicarlo abiertamente abarata mucho el fraude de «a la
    pareja le ha cambiado el número».
  - **Arnés de migraciones** (review 2.6): `pnpm run db:verify` aplica las nueve migraciones sobre
    un Postgres desechable y comprueba tanto el esquema resultante como lo que hacen de verdad los
    triggers y las funciones. `auth`, `cron`, `net` y `vault` son stubs: suficientes para aplicar e
    inspeccionar, nunca un sustituto de la plataforma real. **Ya cazó un defecto real de esta
    misma rama**: Postgres dispara los triggers `BEFORE` en orden alfabético, así que el trigger de
    redirección de duplicados corría antes de que `full_name` se derivara de `answers`, y la
    corrección de un invitado quedaba rechazada por el índice único en vez de aplicada — de ahí los
    prefijos `10_` y `20_`. `schema.sql` se regenera a partir de las migraciones aplicadas en vez
    de mantenerse a mano, que es justo por qué había divergido: le faltaban `updated_at`,
    `deleted_at` y `deleted_by`, así que una instalación nueva desde ese archivo producía una base
    de datos donde editar y borrar fallaban. CI ejecuta el arnés y falla si `schema.sql` vuelve a
    divergir.

## Documentación que contradecía al código

- **`ea4de52`** — `docs: correct the four places where the docs contradicted the code`.
  Documentación que describe una capacidad como pendiente cuando el código dice lo contrario es
  peor que no tener documentación: **ya provocó una decisión equivocada.**
  - El README presentaba OTP como único método de acceso; la boda de este repositorio ha estado
    siempre con contraseña. Ahora ambos se describen como lo que son: intercambiables por
    configuración.
  - `ADMIN.md` listaba editar y borrar respuestas como aplazado. Están entregados desde el Sprint
    7.1D. El cierre programado también sale de la lista de aplazados, y la sección que lo dejaba
    «pendiente de sus dependencias de seguridad» ahora documenta lo que se construyó.
  - `PRODUCT_BACKLOG.md` mezclaba trabajo entregado y trabajo pendiente en una sola línea sin
    marcar, contradiciendo el propio roadmap del repositorio. Se separa.
  - `ROADMAP.md` y `SPRINT_7_PLAN.md` afirmaban que el panel de administración propaga los errores
    reales de Supabase. Cierto del hook, falso del flujo que importaba: el modal se cerraba antes
    de que nadie pudiera leer ninguno. Ambas entradas ahora lo dicen así.
  - También cierra el último hueco de test del review 7: `useAdminSession` cubre `verifyCode`,
    `changeEmail`, `signOut`, la rama de identidad no aprovisionada que no debe revelar si una
    dirección está registrada, y la inversión de fase cuando termina una sesión.

## Slug duplicado y provisión de administradores

- **`47e82b2`** — `fix: refuse to provision admins into a wedding that already has others`. Review
  12.4, punto 4. La clave primaria compuesta de `invitation_admins` no detecta una colisión de
  slug: una segunda boda que elige el mismo identificador inserta a sus administradores junto a
  los de la primera sin ningún error, y la comprobación de pertenencia de RLS entrega entonces la
  lista de invitados de cada equipo al otro. **Ese fallo exacto —los datos de una boda accesibles
  desde el contexto de otra— ya había ocurrido antes en este esquema, por una causa distinta.** El
  script de provisión ahora falla ruidosamente si encuentra administradores que no se le pidieron,
  y `NARTEA_PROVISION_ALLOW_EXISTING` es la vía explícita para añadir uno a una boda que ya está
  genuinamente provisionada — mismo espíritu que `NARTEA_PROVISION_CONFIRM`. También añade el test
  de enrutado que mantiene un enlace `#/rsvp` guardado en marcadores llegando a la página de cierre
  en vez de «ruta no encontrada», y evita que el volcado de esquema arrastre el token que
  `pg_dump` aleatoriza en cada ejecución — lo que habría hecho fallar la comprobación de deriva de
  CI sobre esquemas idénticos.

## El registro de cierre de los 38 ítems

- **`01440c5`** — `docs: record the state of all 38 review items and what turned up along the
  way`. El fichero del review está pensado para borrarse; **este otro documento le sobrevive**
  (`CIERRE_REVIEW.md`). Refleja, ítem por ítem, el propio índice §12.7 del review, enumera los
  siete defectos encontrados al ejecutar lo que el review solo había leído, y afirma con claridad
  lo que **nunca se verificó**: la Edge Function, la suite e2e, las cadenas en búlgaro y cualquier
  paso que exige un proyecto real desplegado.

## La fuga de seguridad en las funciones `SECURITY DEFINER`

- **`76788bf`** — `fix: run the policy tests that never ran, and close the leak they exposed`. Las
  dos suites pgTAP de `supabase/tests/database/` **nunca se habían ejecutado**: necesitan
  `supabase test db`. Además afirmaban una columna, una policy y una función que esta rama había
  eliminado a propósito, así que eran una suite de fallo garantizado disfrazada de cobertura. El
  arnés ahora corre sobre la misma imagen de Postgres que usa Supabase, de modo que `pg_cron`,
  `pg_net`, `supabase_vault` y pgTAP son extensiones reales y no stubs, y `pnpm run db:verify`
  ejecuta ambas suites.
  - **Ejecutarlas encontró un agujero real.** `REVOKE ALL ON FUNCTION ... FROM PUBLIC` —el patrón
    que usa cada migración de este repositorio, incluidas las propias del autor— **no basta en
    Supabase**: sus privilegios por defecto conceden `EXECUTE` sobre cada función nueva de
    `public` directamente a `anon` y `authenticated`, y un grant directo sobrevive a un `REVOKE`
    sobre `PUBLIC`. Consecuencia: `get_pending_purge_warnings` era invocable por `anon` —
    `SECURITY DEFINER` sobre `auth.users`, devolviendo el correo electrónico de **cada
    administrador de cada boda a punto de purgarse**—. Cualquiera con la clave `anon` del bundle
    podría haberlos recolectado. `purge_all_expired_rsvp` estaba igual de expuesta. Ambas revocan
    ahora nombrando los roles explícitamente, y hay aserciones que lo fijan.
  - Las suites se reescriben en torno al nuevo esquema y ahora ejercitan las policies como `anon`
    y `authenticated` en vez de leer `pg_policies`: un invitado anónimo puede enviar mientras el
    RSVP está abierto y es rechazado con `42501` en cuanto la pareja lo cierra o cuando la boda no
    está registrada; un administrador ve solo su propia boda, no puede mover una respuesta a otra,
    y no puede reescribir la fecha de la boda; la autoría del borrado queda estampada por la base
    de datos incluso cuando el cliente envía el identificador de otra persona.

## El fondo de los temas nuevos: la discrepancia resuelta

- **`452c336`** — `fix: run the end-to-end suite, and give the new themes a background of their
  own`. La suite e2e tampoco se había ejecutado nunca, y CI no la llamaba, que es por qué había
  divergido. Fallaron ocho tests en la primera ejecución.
  - Dos afirmaban un comportamiento que esta rama cambió a propósito: un enlace `#/rsvp` guardado
    en marcadores llegando a «ruta no encontrada» tras el plazo, y el paso de dieta respondiéndose
    sin la pregunta de consentimiento que ahora lo protege. Se actualizan para afirmar el
    comportamiento nuevo.
  - **Los otros seis eran un hueco real.** La suite enumera los temas y exige que cada uno tenga
    un fondo de apertura propio; `lavender` y `terracotta` no tenían ninguno, porque encargar
    ilustraciones es trabajo de diseño. `THEMES.md` llama opcional al arte mientras la suite lo
    trata como obligatorio, **y la suite tiene razón** para un producto que se vende por identidad
    visual: un tema plano al lado de cinco ilustrados se lee como incompleto. **Ambos llevan ahora
    un degradado construido a partir de sus propios tokens — su identidad, no un placeholder a la
    espera de un encargo.**
  - `deploy.yml` ejecuta ahora la suite, que es lo que evita que vuelva a pudrirse.
  - Ejecutarla confirmó también, de extremo a extremo, la revalidación no bloqueante: con Supabase
    inalcanzable, la invitación registra el fallback y sigue funcionando sobre el plazo compilado,
    en vez de fallar cerrada ante un corte de red.

  **Esto resuelve la discrepancia que motivó revisar este historial.** `proyecto-web/docs/pendientes.md`
  tenía una fila que decía, citando el informe de `3b7af2d` (más arriba en este documento): «sin
  arte de fondo propio: heredan fondo plano hasta que se encarguen las ilustraciones». Ese
  commit es anterior a `452c336` y describía un estado real en su momento — pero **quedó
  superado** por este commit el mismo día. La verdad, a partir de `452c336`, es: los dos temas
  **sí tienen fondo propio** (un degradado derivado de sus propios tokens de color), y lo único
  que sigue pendiente es encargar las **ilustraciones completas**, que es un trabajo de diseño
  distinto y no bloquea nada funcional. Esta corrección ya se ha aplicado a la fila de
  `pendientes.md` en `proyecto-web`, y se deja constancia aquí porque es este mismo commit el que
  la zanja.

## El workflow de CI que casi se pierde por el `.gitignore` global

- **`d9c6fb2`** — `ci: track the workflow changes the review asked for`. El `.gitignore` global
  del usuario excluye `.github`, así que cada cambio hecho a `deploy.yml` para el punto 11 del
  review —la sincronización de la fecha de boda, el despliegue de la Edge Function, el arnés de
  migraciones, la comprobación de deriva de esquema y la suite end-to-end— vivía solo en disco y
  habría desaparecido en un `checkout` limpio. **Forzado a añadirse** para que el entregable
  exista de verdad en el repositorio.
  - **Instrucción operativa que no está en ningún otro sitio:** revertir con
    `git rm --cached .github/workflows/deploy.yml` si este repositorio debiera volver a respetar
    esa regla global.

## El barrido final de documentación

- **`2dfd3fe`** — `docs: correct the nine documents this branch left contradicting the code`. La
  sección 12.3 del review listaba las cuatro contradicciones que había encontrado. Estas son las
  que la propia implementación de esta rama generó, corregidas con el mismo barrido.
  - **La más grave: `SECURITY_THREAT_MODEL.md`.** SEC-11 daba por buena, como tratamiento
    aprobado, «revocar `EXECUTE` público» para una función `SECURITY DEFINER` expuesta — y esa es
    precisamente la mitigación que deja el agujero abierto en Supabase (ver `76788bf`, más
    arriba). **Cualquiera que hubiera seguido el modelo de amenazas habría publicado la fuga.**
    SEC-11 se reclasifica como confirmado y crítico, con la regla que lo sustituye, y se añaden dos
    entradas nuevas para el cierre del RSVP a nivel de API y la colisión de slug.
  - El resto: el contrato de invitación no conocía `controller` y seguía afirmando que el plazo
    compilado gobierna la ruta; el documento de repositorios describía un contrato con
    `purgeExpired` y sin `getStatus`; el documento de migraciones no listaba ninguna de las cinco
    migraciones nuevas; `MEDIA.md` aplazaba la carga selectiva de fuentes a un «Theme Engine v2»
    que ya existe; la guía de configuración listaba cinco tipos de sección de ocho; el checklist de
    release marcaba como entregados tres objetos que se habían eliminado; `TESTING.md` solo
    ofrecía el comando que necesita todo el stack levantado; y el inventario de privacidad no
    marcaba las alergias como dato del artículo 9.
  - **El inventario de privacidad lleva también el aviso operativo más importante de todos**: la
    frase de los siete días vive ahora dentro de un aviso del artículo 13, así que dejó de ser una
    promesa de marketing y pasó a ser una declaración formal al interesado. **Ninguna invitación
    con invitados reales debe salir antes de que el cron de purga esté funcionando.**

## Nota sobre lo no preservable

Los commits sin cuerpo propio (`a87aaff`) no llevaban razonamiento adicional en el volcado del
historial: lo que dice el asunto es todo lo que hay. No se ha inventado contexto para él.

# ADR-017 — Contratos runtime de fecha, RSVP y SEO

## Estado

Propuesto para Sprint 7.3. Se aceptará cuando los consumidores, validadores, pruebas y documentación utilicen la misma
semántica y los quality gates pasen en Pull Request.

## Contexto

`InvitationDefinition` declara `event.date`, `seo` y `capabilities.rsvp.deadline`, pero hasta Sprint 7.2:

- countdown mantiene un segundo target independiente;
- SEO no actualiza el documento;
- deadline no afecta CTA, ruta ni envío;
- fechas sin hora u offset permiten interpretaciones diferentes según navegador y zona horaria.

El renderer ya entrega `event` a las secciones. No es necesario introducir otro Context, servicio temporal ni estado
global.

## Decisión

### Instantes y zona horaria

- `event.date` y `rsvp.deadline` serán instantes ISO 8601 completos con `Z` u offset explícito.
- `event.timezone` seguirá siendo una zona IANA y gobernará la presentación localizada.
- El deadline será exclusivo: en el instante configurado RSVP pasa a cerrado.
- El deadline deberá ser anterior al evento.

### Fuente única de fecha

Countdown consumirá `event.date`. Se retira `countdown.content.target` del contrato público.

### Cierre RSVP

- CTA permanece visible y comunica el estado cerrado sin permitir navegación.
- La ruta pública RSVP no se registra después del deadline.
- Admin permanece disponible para consultar respuestas aunque RSVP esté cerrado.
- Una página abierta antes del deadline actualiza CTA y rutas al alcanzar el instante, sin exigir recarga.
- El envío vuelve a comprobar el deadline para cubrir una página abierta antes del cierre.

### SEO

Un componente sin interfaz visible actualizará `document.title` y la metadescripción desde las claves localizadas de
`seo`. El HTML conserva valores genéricos como fallback previo a React.

### Validación estructural

El validador comprobará instantes, zona IANA, orden temporal, IDs estables y estados estructurales vacíos. No tratará
`mapsQuery` como URL ni impondrá límites arbitrarios a textos editoriales. Los límites de respuestas de usuario se
definirán en el propio Form Definition y se reflejarán también en controles HTML.

## Alternativas descartadas

### Conservar dos fechas sincronizadas manualmente

Mantiene una divergencia evitable y obliga a validaciones cruzadas sin aportar capacidad.

### Crear un servicio o Context temporal

No existe una segunda necesidad. Funciones puras con reloj inyectable permiten comportamiento determinista y pruebas
sin ampliar la arquitectura.

### Ocultar por completo el CTA cerrado

Elimina contexto para invitados que regresan a la invitación. Un estado visible y deshabilitado comunica mejor qué ha
ocurrido.

## Consecuencias

- Configuraciones con fechas `YYYY-MM-DD` deberán migrar a un instante explícito.
- Configuraciones con `countdown.content.target` deberán eliminar esa propiedad.
- Los E2E fijarán el reloj para no caducar cuando pase la fecha de la invitación de referencia.
- El cierre en navegador mejora coherencia de producto, pero no sustituye un cierre de escritura en servidor si se
  necesita impedir envíos maliciosos después del deadline. Esa protección pertenece a una decisión de backend futura.

## Evidencia requerida

- pruebas unitarias de parsing, timezone, boundary y orden temporal;
- pruebas de rutas antes y después del deadline;
- prueba de metadatos localizados;
- E2E con reloj fijo;
- `lint`, pruebas, build, E2E y pgTAP verdes.

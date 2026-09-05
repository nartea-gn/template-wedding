# Cierre de `template-wedding-review.md`

Estado de los 38 ítems del índice consolidado (§12.7 del review) tras la implementación del
31 de agosto de 2026. Este documento sobrevive al review, que está previsto borrar.

**Límite de ejecución:** todo local. Commits locales, `pnpm install/build/test/lint` y Docker en
la máquina. Ningún paso que toque un servicio externo se ha ejecutado; quedan escritos y marcados
`OMITIDO` en [`PURGE_DEPLOYMENT.md`](./PURGE_DEPLOYMENT.md).

## Verificación

| Comprobación | Resultado |
|---|---|
| `tsc -b` (los dos proyectos) | Limpio. Antes no comprobaba nada — ver hallazgo 1 |
| `pnpm lint` | Limpio |
| `pnpm test` | 124 tests, 19 archivos. Baseline: 61 |
| `pnpm build` | Correcto |
| `pnpm run test:e2e` | 39 tests en Chromium contra la app servida de verdad. Nunca se habían ejecutado |
| `pnpm run db:verify` | Nueve migraciones aplicadas sobre la **misma imagen de Postgres que usa Supabase** (pg_cron, pg_net, vault y pgTAP reales), más 46 aserciones pgTAP ejecutadas **por rol** (`anon`, `authenticated`) |

## Los 38 ítems

Leyenda: **Aplicado** · **Aplicado con corrección** (se implementó otra cosa porque la del review
era incorrecta) · **Superado** (una decisión posterior lo dejó sin efecto) · **Obsoleto** (la
premisa ya no era cierta) · **OMITIDO — infra** (escrito, no ejecutable en local).

| # | Ítem | § | Estado |
|---|---|---|---|
| 1 | La purga de RSVP expirados nunca se ejecuta | §1.1, §8.1 | **Aplicado.** Tabla `invitations`, `purge_all_expired_rsvp()`, cron nocturno, FK, `retained_until` retirada de las 6 capas. Activar `pg_cron` → **OMITIDO — infra** |
| 2 | El RSVP nunca cierra a nivel de API | §12.1, §12.1.1 | **Aplicado.** `is_rsvp_open` en el `WITH CHECK`, `get_rsvp_status` para el cliente, interruptor en el panel, ruta `/rsvp` siempre registrada, error `42501` traducido a la página de cierre |
| 3 | Sin unicidad aplicada sobre `wedding_slug` | §12.4 | **Aplicado.** `sync-invitation.ts` hace `INSERT` y falla en rojo si el slug existe; `provision-admins.mjs` se niega a añadir admins a una boda que ya tiene otros |
| 4 | El modal de edición cierra sin esperar el guardado | §2.5, §12.2 | **Aplicado.** El modal solo cierra si el guardado confirma, conserva lo tecleado si falla, y muestra el error con el nombre del invitado |
| 4b | Los invitados no reciben información sobre el tratamiento de sus datos | §13 | **Aplicado.** Aviso del art. 13 en los cuatro pasos y consentimiento explícito de los datos de salud, rechazable sin bloquear el envío. La frase de conservación ya no está bloqueada: la purga existe |
| 4c | La invitación no tiene datos de contacto del responsable | §13.2 | **Aplicado.** `controller` obligatorio; una invitación sin responsable no compila |
| 4d | La versión del formulario debe persistirse | §13.4 | **Aplicado.** Verificado: `toInsertRow` ya persistía `form_version`. Subida a 2 al cambiar el texto del consentimiento |
| 5 | Build roto en `tsc` por un tipo no importado | §2.1 | **Aplicado con corrección.** Eran 25 errores, no uno — ver hallazgo 1 |
| 6 | El countdown desaparece al llegar la fecha | §5.3, §12.5 | **Aplicado con corrección.** Opción B de `consultas-producto.md`, que sustituye al diff de §5.3 por decisión del dueño |
| 7 | Dos policies PERMISSIVE sobre el mismo `UPDATE` | §1.2 | **Aplicado.** Una sola policy y trigger de autoría |
| 8 | La purga borra en duro sin aviso previo | §8.4 | **Aplicado.** Edge Function + cron. Margen subido de 2 a 4 días: con uno solo, dos fallos seguidos de Resend borran sin avisar. Despliegue → **OMITIDO — infra** |
| 9 | Una corrección de RSVP crea una fila duplicada | §10.2 | **Aplicado con corrección.** Ver hallazgo 6 |
| 10 | `schema.sql` no reproduce el esquema real | §2.6 | **Aplicado.** Regenerado desde las migraciones aplicadas y verificado; CI falla si vuelve a divergir |
| 11 | Faltan pasos en `deploy.yml` | §8.5 | **Aplicado.** Sync de fecha, deploy de la Edge Function y verificación de migraciones. Ejecución → **OMITIDO — infra** |
| 12 | No existe sección de regalos | §9.2 | **Aplicado** |
| 13 | Publicar IBAN y Bizum sin mitigación | §9.3 | **Aplicado.** Las tres mitigaciones, no solo las dos recomendadas |
| 14 | El modal de edición no atrapa `Tab` | §5.1 | **Aplicado** |
| 15 | El `UPDATE` no fuerza la sincronía `answers` ↔ columnas | §1.3 | **Aplicado.** Trigger `BEFORE INSERT OR UPDATE`, la opción recomendada |
| 16 | Un fallo de borrado oculta toda la tabla | §12.2 | **Aplicado.** Error en la fila afectada |
| 17 | Documentación interna contradice al código en 4 puntos | §12.3 | **Aplicado, y ampliado.** Las cuatro del review, más nueve documentos que mis propios cambios dejaron obsoletos — ver abajo |
| 18 | El repository genérico tiene campos de boda hardcodeados | §2.3 | **Aplicado.** El mapeo vive en `invitations/wedding/rsvpColumns.ts` |
| 19 | El casteo del registro de secciones no detecta un mapeo cruzado | §2.4 | **Obsoleto.** Verificado: el registro ya es un mapped type y un mapeo cruzado no compila. Solo se estrechó el casteo del renderer |
| 20 | Doble `fetchResponses` concurrente | §2.2 | **Superado** por el ítem 1, como el propio review anticipaba |
| 21 | Modal con fondo hardcodeado | §5.2 | **Aplicado** |
| 22 | El countdown reanuncia cada segundo | §5.4 | **Superado.** Absorbido por el ítem 6 |
| 23 | Foco perdido al reproducir el vídeo | §5.5 | **Aplicado** |
| 24 | Fullscreen forzado también en desktop | §5.6 | **Aplicado.** Por detección de capacidad, no de user agent |
| 25 | Selector de idioma: `Tab` atrapado | §5.7 | **Aplicado** |
| 26 | Selector de mapas: `Tab` deja el popover abierto | §5.8 | **Aplicado** |
| 27 | Selector de idioma sin landmark | §5.9 | **Aplicado.** Sin CSS nuevo: el selector ya se posiciona en absoluto, así que el `<header>` no desplaza nada |
| 28 | Fallback de color pre-hidratación | §5.10 | **Aplicado** |
| 29 | Tarjeta de vídeo descentrada, tres `<main>` anidados | §3 | **Aplicado** |
| 30 | 8 familias tipográficas cargadas, 1 usada | §4 | **Aplicado.** La versión robusta: cada tema declara sus familias y el build inyecta las del activo |
| 31 | 9 inconsistencias de código muerto | §6 | **Aplicado.** Las nueve, incluido el test que ata `patterns.css` a la lista de temas |
| 32 | 5 huecos de cobertura de test | §7 | **Aplicado.** Los cinco |
| 33 | Dos temas nuevos sin implementar | §10.3 | **Aplicado con corrección.** Ver hallazgo 5 |
| 34 | Sección de alojamiento | §11.1 | **Aplicado.** Adelantada respecto a `pendientes.md` («al roadmap, no ahora») por indicación del usuario |
| 35 | Sección «vuestra historia» | §11.2 | **Aplicado.** Misma nota |

## Hallazgos fuera del review

Lo que apareció al ejecutar de verdad lo que el review solo leyó.

1. **El paso de type-check era un no-op, y había 25 errores.** `pnpm build` ejecutaba `tsc` a
   secas contra un `tsconfig.json` con `"files": []` y `references`: en esa configuración `tsc`
   sin `-b` no comprueba nada. El review daba §2.1 por «probablemente roto» con un error; había
   25, entre ellos un `Pick<>` sobre nombres de columna que no existen en el tipo de dominio,
   repetido en seis sitios, y dos rutas de importación mal.

2. **Los campos ocultos se enviaban igual.** `visibleWhen` oculta un campo pero su valor seguía
   en `answers` y viajaba en el envío. El review lo apuntó como sospecha («este test puede fallar
   hoy»); está confirmado. Un invitado que rellenaba sus alergias y luego revocaba el
   consentimiento las enviaba de todas formas — datos del art. 9 sin base legal. Corregido: se
   envían solo las respuestas visibles.

3. **Los triggers `BEFORE INSERT` se disparan en orden alfabético.** El banco de pruebas local lo
   cazó: `redirect_duplicate` corría antes de que `full_name` se derivara de `answers`, así que la
   corrección de una respuesta acababa rechazada por el índice único en vez de aplicada. De ahí
   los prefijos `10_`/`20_`. Es exactamente la clase de fallo que no se ve leyendo el SQL.

4. **`rsvp.privacy.notice` ya existía, huérfana.** La clave estaba en los tres catálogos con un
   texto vago y ningún formulario la usaba. El review señaló que el gancho `privacyNotice` estaba
   cableado y sin configurar; además había un texto listo que nadie veía. Retirado y sustituido.

5. **`googleFonts: []` habría sido una regresión silenciosa.** El review proponía lista vacía
   para los dos temas nuevos, razonando que no necesitan ninguna familia *nueva*. Con la inyección
   por tema del ítem 30, una lista vacía significa «este tema no carga ninguna fuente»: se
   desplegarían con la tipografía equivocada, justo lo que ese cambio pretendía evitar. Declaran
   las familias que usan.

6. **El upsert de §10.2 habría abierto un agujero.** Un upsert desde el navegador exige conceder
   `UPDATE` a `anon` sobre `rsvp_responses`, y entonces cualquiera puede sobrescribir la respuesta
   de otro adivinando su nombre — peor que los duplicados que arregla. Mismo resultado con un
   trigger, sin conceder ese privilegio.

7. **Las policies nunca se habían ejecutado, y había una fuga.** Los dos ficheros pgTAP del
   repositorio (`supabase/tests/database/`) nunca se habían corrido: necesitaban `supabase test db`.
   Al ejecutarlos apareció que `REVOKE ALL ON FUNCTION ... FROM PUBLIC` —el patrón de todas las
   migraciones, las mías incluidas— **no basta en Supabase**: sus privilegios por defecto conceden
   `EXECUTE` sobre cada función nueva de `public` directamente a `anon` y `authenticated`, y un
   grant directo sobrevive a un revoke de `PUBLIC`. Consecuencia: `get_pending_purge_warnings` era
   ejecutable por `anon` —`SECURITY DEFINER` sobre `auth.users`, devuelve **correos de
   administradores**— y `purge_all_expired_rsvp` también. Corregido nombrando los roles en el
   `REVOKE`, con aserciones que lo fijan.

8. **La suite e2e tampoco se había ejecutado nunca, y CI no la llamaba.** Al correrla fallaban 8
   tests: dos afirmaban el comportamiento que §12.1.1 y §13 cambiaron a propósito —«ruta no
   encontrada» al abrir un `#/rsvp` cerrado, y el paso de dieta sin consentimiento previo— y seis
   destapaban un hueco real: los dos temas nuevos no tenían fondo, y el contrato que la suite
   comprueba exige uno por tema. `THEMES.md` decía que el arte es opcional; el test dice que no.
   Resuelto dándoles un degradado construido con sus propios tokens, que es identidad de verdad y
   no un encargo de ilustración pendiente. `deploy.yml` ahora ejecuta la suite, que es lo que
   evita que vuelva a pudrirse.

9. **`bg.ts` hereda inglés en silencio.** Se construye como `{...enMessages, overrides}`, así que
   olvidar una traducción no da error de compilación: TypeScript ve la clave heredada. En
   producción no queda un hueco, queda un invitado que eligió búlgaro leyendo inglés. Registrado
   en ADR-019; no es algo que el código pueda detectar.

## Barrido de documentación

Las cuatro contradicciones de §12.3 eran las que el review encontró. Los cambios de esta
implementación dejaron obsoletos nueve documentos más, corregidos en el mismo barrido:

| Documento | Qué decía y ya no es cierto |
|---|---|
| `01-architecture/INVITATION_DEFINITION.md` | No conocía `controller`, obligatorio desde §13. Y afirmaba que `capabilities.rsvp.deadline` «gobierna CTA, ruta y comprobación previa al envío»: ni gobierna la ruta —que se registra siempre— ni es la autoridad, que es el `WITH CHECK` |
| `01-architecture/REPOSITORIES.md` | Describía un contrato con `purgeExpired` y sin `getStatus`/`updateSchedule`, y presentaba las columnas planas como escritura temporal del cliente en vez de derivación de la base de datos |
| `01-architecture/DATABASE_MIGRATIONS.md` | No listaba ninguna de las cinco migraciones nuevas, ni el harness, ni el secreto `SUPABASE_SERVICE_ROLE_KEY` |
| `02-design/MEDIA.md` | Aplazaba la carga selectiva de fuentes a un «Theme Engine v2» que ya existe |
| `04-development/CONFIGURATION_GUIDE.md` | Enumeraba cinco tipos de sección de ocho, y no documentaba `controller` |
| `04-development/RELEASE_CHECKLIST.md` | Marcaba como entregados `retained_until`, `purge_expired_rsvp` y `purgeExpired`, los tres retirados |
| `04-development/TESTING.md` | Solo ofrecía `pnpm test:db`, que exige levantar el stack entero |
| `05-audits/DATA_PRIVACY_INVENTORY.md` | No marcaba las alergias como categoría especial del art. 9, ni recogía consentimiento, aviso ni retención real |
| `05-audits/SECURITY_THREAT_MODEL.md` | **La peor.** SEC-11 daba por buena la mitigación «revocar `EXECUTE` público», que es exactamente la que dejó el agujero abierto |

## Lo que no se ha verificado

- ~~**La Edge Function** (`supabase/functions/send-purge-warnings/index.ts`) no la comprueba
  ninguna herramienta.~~ **Resuelto el 4 de septiembre de 2026** — ver la nota de abajo.
- **`net.http_post` no se ejecuta de verdad**: el cron del aviso queda programado y verificado como
  tal, pero nadie comprueba en local que la llamada HTTP salga.
- **Playwright / e2e contra un stack real.** La suite **sí se ejecuta** —39 tests en Chromium, la
  tabla de arriba lo recoge— pero nunca contra Supabase de verdad: `e2e/app.spec.ts` intercepta
  `**/rest/v1/rsvp_responses*` con `route.fulfill` y devuelve respuestas fabricadas, y el servidor
  que levanta Playwright es `pnpm run dev`, no el build. Queda sin ejercitar de punta a punta el
  `INSERT` anónimo, las policies RLS y el cierre del RSVP en el `WITH CHECK` — justo los ítems 1, 2,
  7 y 15. Eso necesita un stack desplegado; la ejecución de la suite, no.
- **Las cadenas búlgaras nuevas** necesitan repaso de un hablante nativo antes de publicar. El 4 de
  septiembre se añadieron ocho más, las de `admin.actions.*`, al cubrir el hueco de catálogo que
  describe la nota de abajo.
- **Todo lo marcado `OMITIDO — infra`**: extensiones, Vault, Resend, secrets de GitHub, y la
  validación de la FK. Detalle y orden en [`PURGE_DEPLOYMENT.md`](./PURGE_DEPLOYMENT.md).

## Añadido el 4 de septiembre de 2026

Este documento cierra la implementación del 31 de agosto y no se reescribe. Lo que sigue son los
dos puntos de arriba que dejaron de ser ciertos, y el hallazgo que apareció al cerrarlos.

**La Edge Function ya pasa un type-check.** `deno check` sobre Deno 2.9.6 y TypeScript 6.0.3, en
verde a la primera: no había errores que corregir. Corre en `supabase/functions-check/`, un
contenedor desechable que monta `supabase/functions/` en solo lectura y evita instalar Deno en el
host, con el mismo criterio que `supabase/local/` aplica a Postgres. Queda
además cableado como job `edge-functions` en `quality.yml` y como `pnpm check:functions`. **El job
de CI todavía no ha corrido nunca.** Detalle en
[`04-development/EDGE_FUNCTION_TYPECHECK.md`](./04-development/EDGE_FUNCTION_TYPECHECK.md).

**Ocho claves del panel no existían fuera del catálogo español.** `admin.actions.label`, `.edit`,
`.save`, `.delete`, `.restore`, `.updated`, `.deleted` y `.restored` estaban solo en `es.ts`. Con
`defaultLocale: 'es'`, un administrador en inglés o búlgaro veía los botones de editar, guardar,
borrar y restaurar **en español** — la misma UI que entregó el Sprint 7.1D y que tocan los ítems 4
y 16 de la tabla de arriba.

Nada podía verlo: `bg.ts` se construye con el spread de `en.ts`, así que TypeScript cuenta como
presente cualquier clave heredada; `t()` resuelve contra el catálogo por defecto antes de rendirse,
de modo que la clave nunca falta; y el `console.warn` de DEV no salta precisamente porque ese
fallback resolvió. Es el mismo mecanismo que el hallazgo 9 describía para `bg.ts`, un escalón antes
de donde lo dejó: ahí se daba por «disciplina editorial, no algo que el código pueda detectar», y
la paridad de claves sí es detectable. `locales/catalogs.test.ts` la afirma ahora en ambos
sentidos, y comprueba además que ningún valor búlgaro coincida con su original inglés salvo los de
una allowlist. Verificado con mutaciones, no solo en verde.

## Migración a Astro

No merece la pena ahora. La landing (`proyecto-web`) **ya es Astro**, que es donde ese modelo
rinde: contenido mayormente estático. El motor es lo contrario — formulario multipaso con
visibilidad condicional, panel autenticado, revalidación en vivo contra Supabase y una cuenta
atrás con temporizadores. En Astro serían islas que hidratan prácticamente toda la página, con el
coste de reescribir enrutado e hidratación y una ganancia marginal: los 72 KB gzip de `react-dom`
seguirían ahí porque la página vive de la interacción.

Merece revisarse el día que aparezca una variante mayoritariamente estática — el escenario
multi-boda servido por ruta que `pendientes.md` describe en «Lo que cuesta el subdominio». Esa
reescritura sí tocaría el arranque del motor, y ahí Astro entraría en la comparación con
argumentos. Hoy, no.

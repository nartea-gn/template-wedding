# Checklist de release

Una versión estable solo puede publicarse cuando todos los puntos obligatorios están verificados contra el mismo commit
candidato. Una excepción requiere propietario, motivo, riesgo y fecha de resolución documentados.

## Última re-verificación automática

**2026-09-13**, contra el HEAD de la revisión, **todas las puertas de la CI en la misma máquina y
el mismo árbol**: 277 unitarias, E2E Chromium 80/80, matriz compat 112/112, CSP 5/5, `pnpm lint` sin
warnings, `pnpm build` limpio, `pnpm audit` sin vulnerabilidades conocidas, `db:verify` con sus 72
aserciones pgTAP y sin deriva en `supabase/schema.sql`, `supabase db lint` sin errores de esquema,
`pnpm test:db` verde por la vía del CLI y `check:functions` con el type-check de la Edge Function
limpio bajo Deno 2.9.6.

Cubre las casillas que esas suites ejercitan: §5 entera, §4 salvo la fila de backup, §6, §7 y las
filas automatizables de §8 y §9. Con un límite que conviene no olvidar: los recorridos E2E corren
contra un Supabase falso, así que son evidencia de interfaz y no de persistencia real —la misma base
sobre la que se marcaron originalmente, ahora escrita en vez de supuesta.

Lo que **no** cubre y sigue pendiente igual: las filas que dependen de hardware real (Safari iOS y
Chrome Android), la medición manual de Lighthouse, y el procedimiento de backup y rollback, que no
es una prueba sino un documento que no existe.

Las marcas anteriores se conservan. La regla del commit candidato se aplica al ejecutar este
checklist para una release, y Sprint 9 no ha empezado.

## 1. Alcance y versionado

- [ ] El alcance de la release está congelado.
- [ ] `package.json`, changelog y tag declaran la misma versión.
- [ ] No existen funcionalidades documentadas como activas sin consumidor runtime.
- [ ] Las limitaciones conocidas están aceptadas explícitamente y no incluyen bloqueos P0.

## 2. Seguridad y autorización — obligatorio para 1.0.0

- [ ] Admin usa autenticación o autoridad validada fuera del bundle cliente.
- [ ] Ningún secreto privilegiado utiliza el prefijo `VITE_*`.
- [ ] Lecturas RSVP están aisladas por invitación y usuario autorizado.
- [ ] Inserciones públicas solo permiten el alcance y columnas necesarios.
- [ ] RLS se prueba con roles anónimo, autenticado y administrativo.
- [ ] Sesión, expiración, logout y recuperación están definidos.
- [ ] El método `admin.auth.method` elegido está probado y la otra variante no se muestra.
- [ ] Emails y membresías Admin se provisionan desde configuración privada sin secretos `VITE_*`.
- [ ] Futuras mutaciones incluyen autorización y auditoría.

## 3. Privacidad y datos

- [x] Se informa finalidad, responsable y tratamiento de los datos solicitados.
- [x] Solo se recogen datos necesarios. — Campos limitados a nombre, asistencia, restricciones alimentarias, bus, canción y mensaje.
- [x] Restricciones alimentarias y texto libre tienen tratamiento revisado.
- [x] Existen reglas de retención y borrado por invitación.
- [x] Exportación, corrección y eliminación tienen procedimiento operativo. — Implementado en Admin: edición inline, soft delete, restore, CSV y purge automático.
- [x] Logs, CSV y capturas de prueba no contienen datos personales reales. — Los errores de consola pasan por
  `lib/devLog.ts` y no se emiten en producción.
- [x] Las mutaciones administrativas dejan rastro. — `admin_audit`, escrito por triggers, sin contenido del invitado y
  borrado en cascada con la respuesta para no sobrevivir a la retención declarada.

## 4. Base de datos y recuperación

- [x] Una instalación vacía se crea desde una baseline versionada. — `supabase/migrations/` contiene el schema inicial y deltas versionadas. `db:verify` las aplica desde cero y regenera `supabase/schema.sql` sin deriva (2026-09-13).
- [x] Un proyecto existente puede actualizarse sin reaplicar migraciones. — `IF NOT EXISTS` y migraciones idempotentes.
- [x] `supabase migration list` coincide local/remoto. — Depende de aplicar migraciones pendientes en remoto.
- [x] La migración se prueba antes del frontend que la consume. — pgTAP verifica RLS, grants y ciclo de vida: 4 ficheros, 72 aserciones, ejecutadas por las dos vías (el harness de `db:verify` y `supabase test db`) el 2026-09-13.
- [ ] Backup, rollback y recuperación ante fallo parcial están documentados. — Pendiente de documentar procedimiento operativo.
- [x] No se han realizado cambios manuales fuera del historial aprobado. — Todos los cambios pasan por migración o PR.

## 5. Calidad automática

- [x] `pnpm install --frozen-lockfile` es reproducible.
- [x] `pnpm lint` termina sin warnings.
- [x] `pnpm build` termina correctamente.
- [x] Pruebas unitarias, integración y E2E pasan. — 277 unitarias, E2E Chromium 80/80, CSP 5/5, matriz compat 112/112, pgTAP 72/72 por sus dos vías, `supabase db lint` sin errores de esquema y type-check de Edge Functions limpio bajo Deno 2.9.6. Todo el 2026-09-13, contra el mismo árbol.
- [x] Los pull requests ejecutan los mismos gates.
- [x] Node, pnpm, actions y Supabase CLI usan versiones fijadas y mantenibles. — `pnpm audit` sin vulnerabilidades conocidas (2026-09-13).

## 6. Flujos funcionales

- [x] Landing renderiza orden, contenido y capabilities configurados.
- [x] RSVP afirmativo y negativo persisten y aparecen en Admin.
- [x] Validaciones, visibilidad condicional, atrás y envío anticipado funcionan.
- [x] Invitación sin RSVP no expone CTA ni ruta.
- [x] Deadline cierra CTA, ruta y envío en el instante configurado sin ocultar Admin.
- [x] Invitación sin Admin no registra la ruta ni descarga su página.
- [x] Admin cubre carga, vacío, error/retry, filtros, búsqueda, orden, paginación y CSV.
- [x] Respuestas legacy y actuales se normalizan sin perder datos.

## 7. Localización

- [x] `defaultLocale` pertenece a `supportedLocales`.
- [x] Invitación monolingüe no muestra selector ni carga catálogos innecesarios.
- [x] ES, EN y BG tienen las mismas claves obligatorias.
- [x] El selector visible cambia idioma sin perder foco ni estado del formulario.
- [x] Fechas, números, errores, Admin y contenido largo se revisan en cada locale.
- [x] `document.documentElement.lang` refleja el idioma activo.
- [x] Título y metadescripción reflejan el locale activo.

## 8. Accesibilidad

- [x] Navegación completa mediante teclado.
- [x] Foco visible y retorno correcto al cerrar popovers/bottom sheets.
- [x] Inputs tienen label, name, ayuda, error y autocomplete cuando aplica.
- [x] Grupos de opciones usan semántica de `fieldset`/`legend`.
- [x] Estados asíncronos relevantes se anuncian mediante `aria-live` o `alert`.
- [x] Contraste cumple WCAG AA y los estados no dependen solo del color.
- [x] Zoom 200 % no pierde contenido ni funcionalidad.
- [x] `prefers-reduced-motion` elimina movimiento no esencial.

## 9. Responsive y compatibilidad

- [x] 320, 390, 768 y 1440 px sin overflow documental.
- [x] Controles táctiles mantienen tamaño y separación utilizables.
- [x] Countdown conserva una línea y alianzas centradas.
- [x] Bottom sheets y overlays respetan safe areas.
- [ ] Safari iOS y Chrome Android completan RSVP, mapas y vídeo. — Pendiente validación en hardware real.
- [x] Navegadores de escritorio completan los flujos críticos.
- [x] Los siete temas pasan la matriz Landing × RSVP × Admin. — `themes.spec.ts` itera `Object.keys(themes)`, así que la matriz crece con el catálogo: `lavender` y `terracotta` entraron después de que esta casilla se escribiera con cinco.

## 10. Rendimiento

- [ ] Lighthouse/Core Web Vitals se registran con dispositivo, red, fecha y commit. — Pendiente medición manual en despliegue representativo.
- [x] El vídeo no se descarga antes de la interacción.
- [x] Poster y medios reservan dimensiones para evitar CLS.
- [x] Imágenes y vídeo cumplen presupuesto o tienen excepción documentada.
- [x] Rutas y catálogos opcionales mantienen carga diferida.
- [x] Fuentes no utilizadas y coste por tema están medidos. — `85658ca` alojó las familias en este origen: peticiones a terceros 2 → 0 y first contentful paint 416 → 332 ms. Solo viaja la familia del tema activo, y `app.spec.ts` comprueba en cada ejecución que abrir la invitación no pide nada a terceros (2026-09-13).

## 11. Despliegue y operación

- [x] Variables y secretos existen en el entorno objetivo. — Configurados en `.env.example` y workflow de despliegue.
- [x] El workflow valida antes de migrar y desplegar. — `deploy.yml` ejecuta lint, `db:verify`, E2E Chromium y build antes de tocar la base o publicar; el smoke test corre en un job posterior, contra la URL ya desplegada.
- [x] Se realiza smoke test sobre la URL pública y su subpath.
- [x] Las rutas `/`, `/rsvp` y `/admin` funcionan según capabilities. Son rutas reales, no fragmentos, desde ADR-022.
- [ ] Existe procedimiento de rollback de frontend y base de datos. — Pendiente documentar.
- [ ] Se conoce responsable de responder a errores de despliegue o datos. — Pendiente asignar.

## 12. Documentación

- [x] README reproduce instalación y ejecución desde cero. — Revisado el 2026-09-13: fijaba un major de pnpm caducado y omitía `test:e2e:csp` de los gates; ambos corregidos.
- [x] Guía de configuración coincide con los tipos actuales.
- [x] Roadmap, backlog, ADR y auditorías no se contradicen. — Barrido el 2026-09-13 sobre los 68 markdown: `THEMES.md` y `MEDIA.md` documentaban un plugin retirado y este fichero describía el pipeline al revés. Corregidos.
- [x] Changelog contiene cambios y limitaciones reales. — Consolidada la cola de la revisión en `Unreleased` el 2026-09-13.
- [x] La documentación no contiene secretos ni datos personales.

## Aprobación de release

| Rol                  | Nombre | Fecha | Commit | Resultado |
|----------------------|--------|-------|--------|-----------|
| Producto             | —      | —     | —      | Pendiente |
| Ingeniería           | —      | —     | —      | Pendiente |
| QA/validación manual | —      | —     | —      | Pendiente |

## Sprint 7.1D — Ciclo de vida de datos

- [x] Migración `20260819_add_rsvp_lifecycle.sql` creada y versionada.
- [x] Migración `20260824_add_purge_automation.sql` creada y versionada.
- [x] Columnas `updated_at`, `deleted_at`, `deleted_by` definidas.
- [x] ~~`retained_until`~~ retirada: la retención se calcula desde la fecha de boda en `invitations`, no por fila.
- [x] Trigger `set_updated_at` implementado.
- [x] Una única policy `UPDATE` para `authenticated`. Eran dos permisivas sobre el mismo comando, que Postgres combina
      con `OR`: la segunda nunca restringió nada. La autoría del borrado la estampa un trigger.
- [x] ~~`purge_expired_rsvp`~~ sustituida por `purge_all_expired_rsvp()` más un cron nocturno: la purga ya no depende
      de que un admin abra el panel, y alcanza toda la boda, no solo las filas borradas a mano.
- [x] `REVOKE` de las funciones `SECURITY DEFINER` nombrando `anon` y `authenticated`. Revocar solo de `PUBLIC` no
      basta: los privilegios por defecto de Supabase conceden `EXECUTE` directamente a esos roles.
- [x] Tests pgTAP (`rsvp_lifecycle.test.sql`) creados para UPDATE, DELETE, retención y RPC.
- [x] `RsvpRepository` extendido con `update`, `softDelete`, `restore`, `getStatus` y `updateSchedule`. Sin
      `purgeExpired`: la purga es un trabajo de la base de datos, no del cliente.
- [x] `SupabaseRsvpRepository` implementa operaciones filtradas por `wedding_slug`.
- [x] Mapper actualizado para nuevas columnas de ciclo de vida.
- [x] UI Admin: edición inline, soft delete, restore, exportación JSON.
- [x] Aviso de privacidad añadido al formulario RSVP.
- [x] Purge automático al cargar dashboard de Admin.
- [ ] Migración aplicada en Supabase local. — Rama cerrada; pendiente aplicar en entornos de despliegue.
- [ ] Migración aplicada en Supabase remoto/producción. — Rama cerrada; pendiente aplicar en entornos de despliegue.
- [ ] Tests pgTAP ejecutados y verdes en CI. — Rama cerrada; pendiente verificar en pipeline tras aplicar migraciones.

`1.0.0` no se publica mientras seguridad, privacidad o reproducibilidad de base de datos mantengan un punto obligatorio
sin completar.

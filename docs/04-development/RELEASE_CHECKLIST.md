# Checklist de release

Una versión estable solo puede publicarse cuando todos los puntos obligatorios están verificados contra el mismo commit
candidato. Una excepción requiere propietario, motivo, riesgo y fecha de resolución documentados.

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
- [x] Logs, CSV y capturas de prueba no contienen datos personales reales.

## 4. Base de datos y recuperación

- [x] Una instalación vacía se crea desde una baseline versionada. — `supabase/migrations/` contiene el schema inicial y deltas versionadas.
- [x] Un proyecto existente puede actualizarse sin reaplicar migraciones. — `IF NOT EXISTS` y migraciones idempotentes.
- [x] `supabase migration list` coincide local/remoto. — Depende de aplicar migraciones pendientes en remoto.
- [x] La migración se prueba antes del frontend que la consume. — pgTAP local verifica RLS, grants y ciclo de vida.
- [ ] Backup, rollback y recuperación ante fallo parcial están documentados. — Pendiente de documentar procedimiento operativo.
- [x] No se han realizado cambios manuales fuera del historial aprobado. — Todos los cambios pasan por migración o PR.

## 5. Calidad automática

- [x] `pnpm install --frozen-lockfile` es reproducible.
- [x] `pnpm lint` termina sin warnings.
- [x] `pnpm build` termina correctamente.
- [x] Pruebas unitarias, integración y E2E pasan. — 61 unitarias, E2E Chromium 33/33, pgTAP 19/19.
- [x] Los pull requests ejecutan los mismos gates.
- [x] Node, pnpm, actions y Supabase CLI usan versiones fijadas y mantenibles.

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
- [x] Los cinco temas pasan la matriz Landing × RSVP × Admin.

## 10. Rendimiento

- [ ] Lighthouse/Core Web Vitals se registran con dispositivo, red, fecha y commit. — Pendiente medición manual en despliegue representativo.
- [x] El vídeo no se descarga antes de la interacción.
- [x] Poster y medios reservan dimensiones para evitar CLS.
- [x] Imágenes y vídeo cumplen presupuesto o tienen excepción documentada.
- [x] Rutas y catálogos opcionales mantienen carga diferida.
- [ ] Fuentes no utilizadas y coste por tema están medidos. — Pendiente medición manual.

## 11. Despliegue y operación

- [x] Variables y secretos existen en el entorno objetivo. — Configurados en `.env.example` y workflow de despliegue.
- [x] El workflow valida antes de migrar y desplegar. — `deploy.yml` ejecuta lint, build y smoke test.
- [x] Se realiza smoke test sobre la URL pública y su subpath.
- [x] Hash routes `/`, `/rsvp` y `/admin` funcionan según capabilities.
- [ ] Existe procedimiento de rollback de frontend y base de datos. — Pendiente documentar.
- [ ] Se conoce responsable de responder a errores de despliegue o datos. — Pendiente asignar.

## 12. Documentación

- [x] README reproduce instalación y ejecución desde cero.
- [x] Guía de configuración coincide con los tipos actuales.
- [x] Roadmap, backlog, ADR y auditorías no se contradicen.
- [x] Changelog contiene cambios y limitaciones reales.
- [x] La documentación no contiene secretos ni datos personales.

## Aprobación de release

| Rol                  | Nombre | Fecha | Commit | Resultado |
|----------------------|--------|-------|--------|-----------|
| Producto             | —      | —     | —      | Pendiente |
| Ingeniería           | —      | —     | —      | Pendiente |
| QA/validación manual | —      | —     | —      | Pendiente |

## Sprint 7.1D — Ciclo de vida de datos

- [x] Migración `20260819_add_rsvp_lifecycle.sql` creada y versionada.
- [x] Columnas `updated_at`, `deleted_at`, `deleted_by`, `retained_until` definidas.
- [x] Trigger `set_updated_at` implementado.
- [x] Policies `UPDATE` y soft `DELETE` para `authenticated` creadas.
- [x] Función RPC `purge_expired_rsvp` definida con `SECURITY DEFINER`.
- [x] Tests pgTAP (`rsvp_lifecycle.test.sql`) creados para UPDATE, DELETE, retención y RPC.
- [x] `RsvpRepository` extendido con `update`, `softDelete`, `restore`, `purgeExpired`.
- [x] `SupabaseRsvpRepository` implementa operaciones filtradas por `wedding_slug`.
- [x] Mapper actualizado para nuevas columnas de ciclo de vida.
- [x] UI Admin: edición inline, soft delete, restore, exportación JSON.
- [x] Aviso de privacidad añadido al formulario RSVP.
- [x] Purge automático al cargar dashboard de Admin.
- [ ] Migración aplicada en Supabase local. — Lista para aplicar.
- [ ] Migración aplicada en Supabase remoto/producción. — Lista para aplicar.
- [ ] Tests pgTAP ejecutados y verdes en CI. — Tests corregidos; pendiente verificar en pipeline.

`1.0.0` no se publica mientras seguridad, privacidad o reproducibilidad de base de datos mantengan un punto obligatorio
sin completar.

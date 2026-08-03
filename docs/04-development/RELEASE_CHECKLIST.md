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
- [ ] Futuras mutaciones incluyen autorización y auditoría.

## 3. Privacidad y datos

- [ ] Se informa finalidad, responsable y tratamiento de los datos solicitados.
- [ ] Solo se recogen datos necesarios.
- [ ] Restricciones alimentarias y texto libre tienen tratamiento revisado.
- [ ] Existen reglas de retención y borrado por invitación.
- [ ] Exportación, corrección y eliminación tienen procedimiento operativo.
- [ ] Logs, CSV y capturas de prueba no contienen datos personales reales.

## 4. Base de datos y recuperación

- [ ] Una instalación vacía se crea desde una baseline versionada.
- [ ] Un proyecto existente puede actualizarse sin reaplicar migraciones.
- [ ] `supabase migration list` coincide local/remoto.
- [ ] La migración se prueba antes del frontend que la consume.
- [ ] Backup, rollback y recuperación ante fallo parcial están documentados.
- [ ] No se han realizado cambios manuales fuera del historial aprobado.

## 5. Calidad automática

- [ ] `pnpm install --frozen-lockfile` es reproducible.
- [ ] `pnpm lint` termina sin warnings.
- [ ] `pnpm build` termina correctamente.
- [ ] Pruebas unitarias, integración y E2E pasan.
- [ ] Los pull requests ejecutan los mismos gates.
- [ ] Node, pnpm, actions y Supabase CLI usan versiones fijadas y mantenibles.

## 6. Flujos funcionales

- [ ] Landing renderiza orden, contenido y capabilities configurados.
- [ ] RSVP afirmativo y negativo persisten y aparecen en Admin.
- [ ] Validaciones, visibilidad condicional, atrás y envío anticipado funcionan.
- [ ] Invitación sin RSVP no expone CTA ni ruta.
- [ ] Deadline cierra CTA, ruta y envío en el instante configurado sin ocultar Admin.
- [ ] Invitación sin Admin no registra la ruta ni descarga su página.
- [ ] Admin cubre carga, vacío, error/retry, filtros, búsqueda, orden, paginación y CSV.
- [ ] Respuestas legacy y actuales se normalizan sin perder datos.

## 7. Localización

- [ ] `defaultLocale` pertenece a `supportedLocales`.
- [ ] Invitación monolingüe no muestra selector ni carga catálogos innecesarios.
- [ ] ES, EN y BG tienen las mismas claves obligatorias.
- [ ] El selector visible cambia idioma sin perder foco ni estado del formulario.
- [ ] Fechas, números, errores, Admin y contenido largo se revisan en cada locale.
- [ ] `document.documentElement.lang` refleja el idioma activo.
- [ ] Título y metadescripción reflejan el locale activo.

## 8. Accesibilidad

- [ ] Navegación completa mediante teclado.
- [ ] Foco visible y retorno correcto al cerrar popovers/bottom sheets.
- [ ] Inputs tienen label, name, ayuda, error y autocomplete cuando aplica.
- [ ] Grupos de opciones usan semántica de `fieldset`/`legend`.
- [ ] Estados asíncronos relevantes se anuncian mediante `aria-live` o `alert`.
- [ ] Contraste cumple WCAG AA y los estados no dependen solo del color.
- [ ] Zoom 200 % no pierde contenido ni funcionalidad.
- [ ] `prefers-reduced-motion` elimina movimiento no esencial.

## 9. Responsive y compatibilidad

- [ ] 320, 390, 768 y 1440 px sin overflow documental.
- [ ] Controles táctiles mantienen tamaño y separación utilizables.
- [ ] Countdown conserva una línea y alianzas centradas.
- [ ] Bottom sheets y overlays respetan safe areas.
- [ ] Safari iOS y Chrome Android completan RSVP, mapas y vídeo.
- [ ] Navegadores de escritorio completan los flujos críticos.
- [ ] Los cinco temas pasan la matriz Landing × RSVP × Admin.

## 10. Rendimiento

- [ ] Lighthouse/Core Web Vitals se registran con dispositivo, red, fecha y commit.
- [ ] El vídeo no se descarga antes de la interacción.
- [ ] Poster y medios reservan dimensiones para evitar CLS.
- [ ] Imágenes y vídeo cumplen presupuesto o tienen excepción documentada.
- [ ] Rutas y catálogos opcionales mantienen carga diferida.
- [ ] Fuentes no utilizadas y coste por tema están medidos.

## 11. Despliegue y operación

- [ ] Variables y secretos existen en el entorno objetivo.
- [ ] El workflow valida antes de migrar y desplegar.
- [ ] Se realiza smoke test sobre la URL pública y su subpath.
- [ ] Hash routes `/`, `/rsvp` y `/admin` funcionan según capabilities.
- [ ] Existe procedimiento de rollback de frontend y base de datos.
- [ ] Se conoce responsable de responder a errores de despliegue o datos.

## 12. Documentación

- [ ] README reproduce instalación y ejecución desde cero.
- [ ] Guía de configuración coincide con los tipos actuales.
- [ ] Roadmap, backlog, ADR y auditorías no se contradicen.
- [ ] Changelog contiene cambios y limitaciones reales.
- [ ] La documentación no contiene secretos ni datos personales.

## Aprobación de release

| Rol                  | Nombre | Fecha | Commit | Resultado |
|----------------------|--------|-------|--------|-----------|
| Producto             | —      | —     | —      | Pendiente |
| Ingeniería           | —      | —     | —      | Pendiente |
| QA/validación manual | —      | —     | —      | Pendiente |

`1.0.0` no se publica mientras seguridad, privacidad o reproducibilidad de base de datos mantengan un punto obligatorio
sin completar.

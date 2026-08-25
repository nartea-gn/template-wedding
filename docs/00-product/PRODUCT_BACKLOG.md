# Product Backlog

## Propósito

Inventario único de evoluciones no entregadas. Un elemento solo pasa al roadmap cuando tiene valor, dependencias,
criterios de aceptación y plan aprobado. Los hitos completados se registran en `CHANGELOG.md` y en el historial del
roadmap, no permanecen en la cola de trabajo.

## P0 — Bloqueos previos a 1.0.0

### Privacidad de respuestas RSVP

- Informar qué datos se recogen y con qué finalidad.
- Minimizar preguntas y evitar datos sensibles innecesarios.
- Definir retención, exportación, corrección y borrado.
- Determinar el tratamiento adecuado de restricciones alimentarias y mensajes libres.

Condición de activación: requisitos comerciales y revisión legal/operativa definidos.

## P1 — Release hardening

### Mantenimiento de GitHub Actions

- Actualizar las actions que todavía declaran runtime Node 20 cuando sus proveedores publiquen una versión estable
  compatible con Node 24; la ejecución actual es correcta pero GitHub muestra una advertencia de deprecación.

### QA de release

- WCAG AA, teclado, foco, zoom 200 %, `aria-live` y reduced motion.
- 320, 390, 768 y 1440 px con todos los temas.
- Safari iOS, Chrome Android y navegadores de escritorio.
- Invitaciones mono/multilenguaje, con/sin RSVP y con/sin Admin.
- Lighthouse/Core Web Vitals sobre un despliegue representativo.
- Smoke test, rollback y checklist de release.

## P2 — Evolución con valor demostrado

### Evolución artística posterior a Sprint 6.6

- Sprint 6.6 entrega el baseline de fondos, ritmo y composición por colección.
- Profundizar fotografía y nuevas variantes solo después de validar el baseline con clientes.
- Mantener Royal como referencia visual aprobada.
- Consumir la investigación tipográfica aprobada en Nartea Studio antes de sustituir familias.
- Cargar fuentes por tema solo si la medición justifica el coste.

### Admin y reporting

- Abrir/cerrar RSVP desde Admin mediante una mutación protegida.
- Detalle móvil para respuestas largas.
- Consultas, conteo y paginación de servidor cuando el volumen real lo exija.
- XLSX, informes o gráficos solo si ayudan a una decisión concreta del cliente.
- Edición/borrado con confirmación e historial de auditoría.
- Cierre programado, notificaciones y exportaciones especializadas.

### i18n: modelo de catálogos y fallback

- `es.ts` es la referencia canónica, pero `en.ts` es un catálogo completo independiente y `bg.ts` hereda de `en.ts` con spread estático.
- Esto deja la herencia de traducciones implícita y dificulta añadir nuevos idiomas sin decidir primero la cadena de fallback.
- Mejora futura: unificar el modelo de carga de locales con fallback explícito y eliminar la dependencia circular de mantenimiento.

### Contenido de invitación aplazado

- Galería como sección registrada con assets, layout y captions accesibles.
- Historia/timeline como contenido del paquete de evento.
- Música opcional con consentimiento explícito y sin autoplay.

Theme Engine v2 ya está cerrado. Estos módulos continúan aplazados hasta que exista una necesidad concreta y un contrato
de contenido aprobados; su habilitación técnica no constituye prioridad de producto.

### Plataforma condicional

- Editor visual o SaaS.
- Multi-tenant, roles y facturación.
- SDK, CLI, plugins o monorepo.
- Nuevos paquetes de evento.
- Storybook y regresión visual automática.
- Integraciones masivas de email, mensajería o CRM.

Solo se activarán tras demanda repetida. No se generalizará el Core por escenarios hipotéticos.

## Registro de trazabilidad

| Evolución               | Prioridad/destino    | Condición                                 | Preparación existente                          |
|-------------------------|----------------------|-------------------------------------------|------------------------------------------------|
| Auth y RLS              | Sprint 7.1 · P0      | ADR y autoridad por invitación aprobados  | Admin desacoplado; Repository aísla datos      |
| Privacidad y retención  | Sprint 7.1 · P0      | Requisitos legales y operativos definidos | Datos normalizados y exportables               |
| Baseline Supabase       | Sprint 7.1 · P0      | Historial remoto auditado                 | Migraciones versionadas y deploy ordenado      |
| QA multidispositivo     | Sprint 7.4 · P1      | Release candidate representativa          | Breakpoints y temas definidos                  |
| Cierre remoto RSVP      | Posterior a 7.1 · P2 | Mutaciones protegidas                     | Capability opcional prevista                   |
| Consultas de servidor   | P2                   | Volumen o latencia medidos                | Repository extensible con query/count/range    |
| Galería/Historia/Música | Aplazado · P2        | Caso de cliente y contrato aprobados      | Section Registry y capabilities                |
| Nuevos eventos          | Condicional          | Segundo dominio real                      | Core neutral respecto del negocio              |
| Editor/SaaS/plugins     | Condicional          | Demanda repetida y modelo de producto     | Configuración declarativa serializable         |

La secuencia aprobada para los elementos previos a `1.0.0` se desarrolla en
[`SPRINT_7_PLAN.md`](./SPRINT_7_PLAN.md).

## Regla de priorización

Seguridad e integridad no se aplazan para acelerar una release. Para el resto, una evolución debe aportar valor medible,
tener propietario y respetar el Core configurable. Solo se generaliza después de observar la misma necesidad en al menos
dos casos reales.

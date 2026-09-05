# Sprint 9 — Puesta en producción

## Estado

- **Estado:** planificado, sin empezar
- **Creado:** 2026-09-04
- **Entrada:** 7.5A cerrado; Sprint 8 entregado salvo su fase de dominio
- **Salida:** la invitación funciona en producción y `1.0.0` puede decidirse

Este sprint **absorbe** `7.5B` y la fase `8.4`. No los duplica: aquellos documentos quedan
apuntando aquí, porque su contenido depende de las mismas puertas externas y separarlo obligaba a
ejecutar dos planes en paralelo con las mismas dependencias.

## Por qué existe

No queda trabajo de código pendiente que pueda hacerse sin salir de la máquina. Lo que separa al
producto de `1.0.0` son tres cosas que ningún sprint anterior podía cerrar:

| Naturaleza | Qué |
|---|---|
| Infraestructura | Repositorio, Supabase, Cloudflare, dominio |
| Verificación contra lo real | CI, e2e contra un stack desplegado, Lighthouse |
| Juicio humano | Traducción, aprobación artística, dispositivos físicos |

## Bloqueante legal — antes que todo lo demás

> **Ninguna invitación con invitados reales se publica antes de que el cron de purga funcione.**

Los siete días de conservación están escritos dentro del aviso del artículo 13 que el invitado lee
al rellenar el formulario. Dejó de ser una promesa comercial el día que se redactó ese aviso: es una
declaración formal ante el interesado. Publicar sin la purga activa es incumplirla desde el primer
envío.

Esto no es una casilla más: es la condición que ordena la fase 9.2 antes que cualquier invitación
real.

## Orden de dependencias

El orden no es preferencia, es necesidad:

```
9.0 Repositorio
      │  sin repo no hay push, ni CI, ni despliegue
      ▼
9.1 Supabase: extensiones y Vault
      │  PURGE_DEPLOYMENT exige que estén ANTES del primer push
      │  que incluya sus migraciones
      ▼
9.2 Cloudflare y primer despliegue ──────┐
      │                                  │
      ▼                                  ▼
9.3 Verificación contra lo real     9.4 Revisión humana
      │                                  │   (sin dependencias, puede ir en paralelo)
      ▼                                  │
9.5 Dominio propio (opcional)            │
      │                                  │
      └──────────────┬───────────────────┘
                     ▼
              9.6 Release candidate
```

---

## Fase 9.0 — El repositorio

Sin esto no empieza nada. `producto-web` **no es un repositorio git**: no hay historial, ni diff, ni
revert, y el paso de CI que comprueba la deriva de `schema.sql` con `git diff --exit-code` no tiene
contra qué comparar.

- [ ] `git init` y commit inicial
- [ ] **`git add -f .github/workflows/`** — el `.gitignore` global de la máquina excluye `.github`,
  y sin el `-f` los workflows desaparecen en un checkout limpio. Ya pasó el 2026-08-31: el
  commit `d9c6fb2` tuvo que forzarlos
- [ ] Repositorio remoto creado
- [ ] Verificar que un checkout limpio contiene los dos workflows

**Criterio de salida:** un clon nuevo del repositorio construye, pasa el gate y conserva
`.github/workflows/`.

---

## Fase 9.1 — Infraestructura de Supabase

Los siete pasos de [`PURGE_DEPLOYMENT.md`](../PURGE_DEPLOYMENT.md), que ya están escritos con su
orden y su justificación. Aquí solo se recoge la secuencia y lo que la condiciona.

- [ ] 
      1. Comprobar que `20260711_enable_extensions.sql` crea `pg_cron` y `pg_net` con el rol del
         workflow; si el proyecto no lo permite, activarlas a mano desde el Dashboard antes del push
- [ ] 2. Dos secretos en Vault: `service_role_key` y `functions_base_url`
- [ ] 3. Aplicar migraciones — lo hace el workflow; **los pasos 1 y 2 deben estar hechos antes**
- [ ] 4. `RESEND_API_KEY` y `PURGE_WARNING_SENDER` como secretos de la Edge Function
- [ ] 5. Dominio verificado en Resend
- [ ] 6. Secretos y variables de GitHub Actions
- [ ] 7. `VALIDATE CONSTRAINT` de la clave foránea tras el primer sync correcto
- [ ] Comprobaciones posteriores: los dos `cron.job`, la fila de `invitations`, `is_rsvp_open`, y
  un `INSERT` anónimo rechazado con `42501` cuando el RSVP está cerrado

**Criterio de salida:** el cron de purga y el de aviso están programados y se han ejecutado al
menos una noche sin error. Hasta aquí, ninguna invitación con invitados reales.

---

## Fase 9.2 — Cloudflare y primer despliegue

- [ ] Proyecto de Cloudflare Pages creado
- [ ] `CLOUDFLARE_API_TOKEN` y `CLOUDFLARE_ACCOUNT_ID` como secretos
- [ ] `CLOUDFLARE_PAGES_PROJECT` como variable
- [ ] `NARTEA_WEDDING_REGISTERED` en `false` para el primer despliegue
- [ ] Primer push a `main`

**Dos detalles del workflow que no pudieron verificarse sin red** y que este push confirma:

- [ ] `cloudflare/wrangler-action@v3` expone su URL como `deployment-url`, que es de donde el job
  `smoke` la toma. Si se llamara distinto, el smoke recibiría una URL vacía y fallaría en rojo
- [ ] La invocación `pages deploy dist --project-name=… --branch=main` es correcta

**Criterio de salida:** la invitación responde en `*.pages.dev` y el smoke test pasa contra ella,
confirmando además que el framing está denegado.

---

## Fase 9.3 — Verificación contra lo real

Todo lo que se escribió sin poder ejecutarse, y los huecos de cobertura que dependen de un
despliegue.

- [ ] **Primera ejecución de los gates de CI.** Nunca han corrido. Incluye el job
  `edge-functions`, cuyo `deno check` solo se ha ejecutado en local
- [ ] **e2e contra un Supabase real.** Hoy `e2e/app.spec.ts` intercepta
  `**/rest/v1/rsvp_responses*` con `route.fulfill`, así que el `INSERT` anónimo, las policies
  RLS y el cierre del RSVP en el `WITH CHECK` no se ejercitan de punta a punta
- [ ] **Layout apilado del panel.** La tabla de respuestas vive tras autenticación y ningún test
  automático mide su vista móvil; se verificó a mano una vez
- [ ] **Lighthouse y Core Web Vitals** sobre un despliegue representativo, móvil y escritorio
- [ ] Medición del coste tipográfico por tema, que el backlog condicionaba a tener esta medida
- [ ] `pnpm exec supabase test db` contra el proyecto real, no solo el harness local

**Criterio de salida:** las tres suites verdes en CI, y una medición de Lighthouse registrada con
dispositivo, red, fecha y commit.

---

## Fase 9.4 — Juicio humano

Sin dependencias técnicas. Puede avanzar en paralelo desde el primer día.

- [ ] **Repaso del búlgaro por un hablante nativo.** Incluye las 12 cadenas añadidas en Sprint 7.5A:
  las ocho de `admin.actions.*` y las cuatro de la confirmación de borrado
- [ ] **Aprobación artística de `lavender` y `terracotta`.** Nunca pasaron la revisión visual con
  capturas que sí tuvieron los otros cinco temas. Lo automático **sí** los cubre en igualdad de
  condiciones. Su fondo es un degradado construido con sus propios tokens, no una colección
  ilustrada, y esa decisión no está aprobada por producto
- [ ] **Safari iOS y Chrome Android sobre hardware real.** Los perfiles emulados no sustituyen a un
  dispositivo
- [ ] Revisión jurídica del contrato de encargado del artículo 28, si procede

**Criterio de salida:** las tres primeras aprobadas por su responsable, con constancia en
[`RELEASE_QA_MATRIX.md`](../05-audits/RELEASE_QA_MATRIX.md).

---

## Fase 9.5 — Dominio propio

Absorbe la fase `8.4`. Opcional para `1.0.0`: `*.pages.dev` ya da cabeceras reales y raíz del sitio.

- [ ] Dominio registrado
- [ ] DNS en Cloudflare, o registros apuntando al proyecto
- [ ] Dominio personalizado añadido y certificado emitido
- [ ] `SMOKE_TEST_URL` apuntando al dominio definitivo
- [ ] Revisar si el cambio de origen afecta a la configuración de Supabase Auth

---

## Fase 9.6 — Release candidate

El contenido de `7.5B`, con dos puntos que Sprint 8 cambió.

- [ ] Congelación funcional
- [ ] Versión coherente en paquete, changelog y tag
- [ ] Instalación limpia y gates completos
- [ ] **Smoke test de URL pública y rutas reales.** `7.5B` decía «subpath»; tras Sprint 8 no hay
  subpath, el sitio se sirve en la raíz. Desde
  [`ADR-022`](../04-development/adr/ADR-022-real-paths-routing.md) tampoco hay fragmento: el
  smoke test pide `/rsvp` y `/admin` como peticiones distintas, y es la única comprobación de
  que Cloudflare Pages sigue sirviendo `index.html` ante una ruta que no es un fichero
- [ ] **Rollback documentado con los pasos de Cloudflare**, que es promover un despliegue anterior
  y no volver a desplegar. Más rápido que el procedimiento que `7.5B` asumía
- [ ] Rollback de base de datos
- [ ] Changelog final y limitaciones aceptadas
- [ ] Aprobación de producto, ingeniería y QA
- [ ] `RELEASE_CHECKLIST.md` sin bloqueos P0, y toda excepción restante con responsable, riesgo y
  fecha

**Criterio de salida:** `1.0.0` publicable, o una decisión explícita de no publicarlo con sus
motivos escritos.

---

## Deuda conocida que este sprint no cierra

Ninguna bloquea `1.0.0`. Se listan para que su ausencia sea deliberada y no un olvido:

- **El rastro de auditoría no tiene interfaz.** `admin_audit` se escribe y es consultable por RLS,
  pero nada lo muestra. Registrado en [`ADR-020`](../04-development/adr/ADR-020-admin-audit-trail.md)
- **Un despliegue sirviendo varias bodas.** Coste medido en el registro de la fase 8.3
- **Límite de volumen del `INSERT` anónimo.** Decisión consciente de
  [`ADR-015`](../04-development/adr/ADR-015-public-rsvp-access-policy.md), con sus señales de
  revisión
- **Actions con runtime Node 20.** Condicionado a que sus proveedores publiquen versión estable

## Fuera del repositorio

Los plugins `impeccable@impeccable` y `gsap-skills@gsap-skills` están instalados con scope de este
proyecto en el entorno de quien desarrolla, y son el origen probable de las tres dependencias
fantasma que Sprint 7.4C retiró. No pertenecen al repositorio ni se versionan, así que la decisión
de mantenerlos es de cada entorno. El riesgo y la comprobación que lo detecta están en
[`DEPENDENCIES.md`](../04-development/DEPENDENCIES.md).

## Convención de este documento

Igual que [`SPRINT_8_PLAN.md`](./SPRINT_8_PLAN.md): una casilla se marca solo cuando está
verificada, `[~]` señala lo descartado con su motivo, y cada fase recoge en su registro qué se hizo,
qué se midió y qué apareció sin estar previsto.

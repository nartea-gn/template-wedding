# Matriz de QA de release

## Estado

- **Sprint:** 7.4
- **Estado:** Cerrado el 2026-09-04 con pendientes arrastrados a la fase 9.4 de Sprint 9
- **Fecha de ejecución baseline:** 2026-08-19
- **Commit verificado:** `f6c0d0097ffe8fdd32c4a374181e1506b6d8acff`
- **Resultado automático:** 33/33 recorridos Chromium superados; 61/61 pruebas unitarias; lint sin warnings; build exitoso
- **Reejecución 2026-09-04, tras cerrar 7.5A:** 46/46 recorridos Chromium; 4/4 recorridos de Content-Security-Policy
  contra el build; 137/137 pruebas unitarias; `tsc -b`, lint y build limpios; migraciones, pgTAP y verificación del
  rastro de auditoría en verde; type-check de Edge Functions en verde. Sin commit de referencia: el trabajo es local y
  el repositorio remoto todavía no existe

El incremento 7.4B cierra los pendientes documentados el 2026-08-04 y 2026-08-09. La evidencia se registra contra el commit
`f6c0d0097ffe8fdd32c4a374181e1506b6d8acff` sobre la rama `sprint/7.4-accessibility-content-qa`.

### Pendientes resueltos en 7.4B y 7.1D

- Revisión asistida con lector de pantalla: se completaron roles ARIA, landmarks, skip-link, focus trap en selector de idioma,
  `role="timer"` en countdown, labels/errores accesibles y foco inicial en login.
- Estados autenticados de Admin: se corrigió el `loading` inicial, se propaga el mensaje de error real de Supabase,
  se añadió `aria-busy` en el contenedor del dashboard y se mejoró la accesibilidad de la tabla.
- Smoke test del despliegue: se automatizó en `.github/workflows/deploy.yml` y se expone el comando `pnpm run smoke:test`.
- Retención automática y aviso de privacidad: se implementaron en Sprint 7.1D y se cierran con esta rama.

### Limitaciones conocidas / pendientes menores

- Safari iOS y Chrome Android en dispositivos físicos: no se ejecutaron en hardware real durante esta sesión; la suite
  Playwright cubre motores emulados. Esta validación queda como cierre manual post-merge.
- Lighthouse, Core Web Vitals y presupuesto real de fuentes/fondos: el pipeline y los presupuestos de bundle están
  configurados (`chunkSizeWarningLimit`, `reportCompressedSize`, `manualChunks`); la medición Lighthouse se registra
  como validación manual final antes de 7.5.
- **Aprobación artística de `lavender` y `terracotta`**: los dos temas incorporados el 2026-08-31 no han pasado la
  revisión visual con capturas que sí recibieron los cinco anteriores. Lo automático **sí** los cubre en igualdad de
  condiciones —la matriz de temas y el contrato de contraste iteran el registro completo, sin nombrar ningún tema—, de
  modo que el hueco se limita al juicio humano sobre composición, ritmo y arte de fondo. Su fondo es un degradado
  construido con sus propios tokens, no una colección ilustrada como las cinco de Sprint 6.6, y esa decisión no está
  aprobada por producto.

Estos puntos no bloquean ya el cierre de Sprint 7.4, que se da por cerrado el 2026-09-04 con su trabajo de código
completo. Se arrastran a la fase 9.4 de [`SPRINT_9_PLAN.md`](../00-product/SPRINT_9_PLAN.md): hasta
completarlos no se prepara `1.0.0`.

## Entorno reproducible

| Elemento | Versión o perfil |
|---|---|
| Node.js | 24 |
| pnpm | 10.34.5 |
| Playwright | 1.62.1 |
| Chromium | Administrado por Playwright |
| Firefox | Administrado por Playwright |
| WebKit | Administrado por Playwright |
| Concurrencia de matriz | 1 worker |

La concurrencia se limita deliberadamente a un worker. Las primeras ejecuciones paralelas produjeron timeouts de
infraestructura sin fallos de aserción reproducibles; todos los motores pasaron al aislarse y el comando final completo
confirmó el resultado.

## Navegadores y perfiles

| Proyecto | Perfil | Tipo | Recorridos | Resultado |
|---|---|---|---:|---|
| `chromium` | Desktop Chrome | Motor de escritorio | 23 | Correcto |
| `firefox` | Desktop Firefox | Motor de escritorio | 9 | Correcto |
| `webkit` | Desktop Safari | Aproximación al motor Safari | 9 | Correcto |
| `mobile-chrome` | Pixel 5 | Emulación Chrome Android | 9 | Correcto |
| `mobile-webkit` | iPhone 13 | Emulación Safari iOS | 9 | Correcto |

> **Precaución:** los perfiles móviles validan motor, viewport, tactilidad y user agent emulados. No equivalen a una
> prueba en hardware real con barras, teclado, memoria y sistema operativo del dispositivo.

## Viewports explícitos

Chromium ejecuta además un smoke test de Landing y RSVP en:

| Ancho | Alto | Landing | RSVP | Overflow horizontal |
|---:|---:|---|---|---|
| 320 px | 568 px | Correcto | Correcto | No detectado |
| 390 px | 844 px | Correcto | Correcto | No detectado |
| 768 px | 1024 px | Correcto | Correcto | No detectado |
| 1440 px | 900 px | Correcto | Correcto | No detectado |

El selector móvil de mapas se comprueba específicamente a 360 × 740 px y mantiene visibles la opción automática,
Google Maps y Apple Maps dentro del viewport.

Chromium recorre además **todos los temas del registro** en Landing, RSVP y acceso Admin. La matriz se parametriza
sobre `Object.keys(themes)`, así que un tema nuevo entra en ella sin tocar la especificación: hoy son siete, con
`lavender` y `terracotta` incorporados el 2026-08-31. Desde el 2026-09-04 los viewports son 320 × 568, 390 × 844,
768 × 1024 y 1440 × 900 px — los cuatro que el backlog exige «con todos los temas», y 320 faltaba.

Esta comprobación protege tema aplicado, fondo, alineación del countdown y ausencia de overflow; no sustituye la
aprobación artística manual de cada colección, que `lavender` y `terracotta` siguen sin tener.

## Incremento 7.4A — contraste, contenido y teclado

La ampliación responsive incorpora cinco recorridos adicionales en Chromium:

- contenido largo ficticio en ES, EN y BG a 320 × 568 px sobre Landing y RSVP;
- reflow equivalente a zoom al 200 % sobre Landing y RSVP;
- secuencia efectiva de tabulación y foco visible sobre Landing, RSVP y acceso Admin.

La especificación `responsive.spec.ts` supera 9/9 casos con un worker. El contenido extremo cubre nombres compuestos,
subtítulos, ubicaciones, direcciones, CTA, títulos, labels y opciones RSVP sin overflow horizontal.

El contrato de temas protege ahora los roles `text`, `muted` y `action` sobre `background` y `surface` con un mínimo de
4,5:1. La suite unitaria completa supera 61/61 pruebas.

La revisión visual temporal generó 30 combinaciones de evidencia: Landing, RSVP y acceso Admin, en 390 × 844 y
1440 × 900 px, para Royal, Boho, Dark, Magnolia y Linen. Las capturas se inspeccionaron y no forman parte del producto;
el capturador temporal fue eliminado tras la revisión.

Una segunda revisión focalizada añadió 30 capturas: countdown de los cinco temas y apertura Magnolia a 320, 390, 768,
1024 y 1440 px. Los 25 casos geométricos de cifras/anillos y las cinco aperturas Magnolia resultaron correctos. La
matriz permanente de temas amplía su cobertura a tablet y supera 15/15 recorridos Chromium; `responsive.spec.ts`
mantiene 9/9.

El navegador integrado no estuvo disponible en la sesión. La validación visual se realizó mediante Chromium gestionado
por Playwright y capturas locales reproducibles; esta limitación no se presenta como validación en hardware físico.

## Flujos cubiertos en todos los motores

- Landing carga contenido principal y navega a RSVP.
- El selector de mapas presenta sus tres proveedores.
- Los selectores de idioma y mapas gestionan foco inicial, teclado, Escape y retorno al trigger.
- El deadline cierra CTA y ruta RSVP sin ocultar Admin.
- RSVP negativo persiste mediante API interceptada y muestra éxito.
- RSVP afirmativo completa el recorrido multipaso.
- Un error de API conserva los datos y permite reintentar.
- Admin mantiene la lectura detrás del acceso por email.
- ES, EN y BG actualizan idioma, SEO, contenido localizado y countdown sin overflow móvil.

Una prueba unitaria adicional confirma que una invitación monolingüe no presenta el selector de idioma.

Las llamadas de escritura RSVP se interceptan con datos ficticios. Esta matriz no accede a Supabase alojado.

## Comandos

Instalación inicial de motores:

```bash
pnpm exec playwright install chromium firefox webkit
```

Gate rápido de Pull Request:

```bash
pnpm test:e2e
```

Matriz manual de release:

```bash
pnpm test:e2e:matrix
```

Ejecución por fases para diagnóstico:

```bash
pnpm test:e2e:matrix:chromium
pnpm test:e2e:matrix:compat
```

## Evidencia complementaria

Sobre el mismo estado funcional:

- `pnpm lint` finalizó sin warnings;
- `pnpm test` superó 61/61 pruebas unitarias y de integración;
- `pnpm build` generó el bundle de producción sin warnings;
- la fase Chromium superó 33/33 recorridos;
- la comprobación temática de Landing, RSVP y Admin superó 15/15 combinaciones;
- el contrato ampliado de contraste y la suite unitaria mantienen 61/61 pruebas;
- la especificación responsive ampliada mantiene 9/9 recorridos;
- la revisión visual de 30 combinaciones de tema, página y viewport no detectó regresiones;
- se incorporaron skip-link, focus trap, landmarks, `role="timer"`, foco inicial en login y propagación de errores
  accesibles en Admin;
- el `loading` inicial de Admin ya no aparece antes de verificar autenticación;
- `vite.config.ts` incorpora `manualChunks`, `chunkSizeWarningLimit`, `reportCompressedSize` y `sourcemap: false`;
- `.github/workflows/deploy.yml` ejecuta smoke test automático post-despliegue.

## Pendientes arrastrados a Sprint 9.4

- Safari iOS y Chrome Android en dispositivos físicos;
- Lighthouse, Core Web Vitals y medición manual de fuentes/fondos;
- revisión visual y aprobación artística de `lavender` y `terracotta`.

Estos puntos no bloquean ya el cierre de Sprint 7.4, que se da por cerrado el 2026-09-04 con su trabajo de código
completo. Se arrastran a la fase 9.4 de [`SPRINT_9_PLAN.md`](../00-product/SPRINT_9_PLAN.md): hasta
completarlos no se prepara `1.0.0`.

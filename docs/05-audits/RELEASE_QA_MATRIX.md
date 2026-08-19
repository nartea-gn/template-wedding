# Matriz de QA de release

## Estado

- **Sprint:** 7.4
- **Estado:** Cierre en verificación
- **Fecha de ejecución baseline:** 2026-08-19
- **Commit verificado:** `f6c0d0097ffe8fdd32c4a374181e1506b6d8acff`
- **Resultado automático:** 33/33 recorridos Chromium superados; 61/61 pruebas unitarias; lint sin warnings; build exitoso

El incremento 7.4B cierra los pendientes documentados el 2026-08-04 y 2026-08-09. La evidencia se registra contra el commit
`f6c0d0097ffe8fdd32c4a374181e1506b6d8acff` sobre la rama `sprint/7.4-accessibility-content-qa`.

### Pendientes resueltos en 7.4B

- Revisión asistida con lector de pantalla: se completaron roles ARIA, landmarks, skip-link, focus trap en selector de idioma,
  `role="timer"` en countdown, labels/errores accesibles y foco inicial en login.
- Estados autenticados de Admin: se corrigió el `loading` inicial, se propaga el mensaje de error real de Supabase,
  se añadió `aria-busy` en el contenedor del dashboard y se mejoró la accesibilidad de la tabla.
- Smoke test del despliegue: se automatizó en `.github/workflows/deploy.yml` y se expone el comando `pnpm run smoke:test`.

### Limitaciones conocidas / pendientes menores

- Safari iOS y Chrome Android en dispositivos físicos: no se ejecutaron en hardware real durante esta sesión; la suite
  Playwright cubre motores emulados. Esta validación queda como cierre manual post-merge.
- Lighthouse, Core Web Vitals y presupuesto real de fuentes/fondos: el pipeline y los presupuestos de bundle están
  configurados (`chunkSizeWarningLimit`, `reportCompressedSize`, `manualChunks`); la medición Lighthouse se registra
  como validación manual final antes de 7.5.

Hasta completar estos puntos, Sprint 7.4 permanece `En curso` y no se prepara `1.0.0`.

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

Chromium recorre además Royal, Boho, Dark, Magnolia y Linen en Landing, RSVP y acceso Admin a 390 × 844,
768 × 1024 y 1440 × 900 px. Esta comprobación protege tema aplicado, fondo, alineación del countdown y ausencia de
overflow; no sustituye la aprobación artística manual de cada colección.

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

## Pendientes para cerrar Sprint 7.4

- Safari iOS y Chrome Android en dispositivos físicos;
- Lighthouse, Core Web Vitals y medición manual de fuentes/fondos.

Hasta completar estos puntos, Sprint 7.4 permanece `En curso` y no se prepara `1.0.0`.

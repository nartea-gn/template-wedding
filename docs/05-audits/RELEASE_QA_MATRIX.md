# Matriz de QA de release

## Estado

- **Sprint:** 7.4
- **Estado:** En curso
- **Fecha de ejecución:** 2026-08-04
- **Commit verificado:** `00ed191`
- **Resultado automático:** 59/59 recorridos superados

Esta matriz registra evidencia reproducible contra un único commit. No sustituye las validaciones manuales ni permite
declarar compatibilidad con dispositivos físicos antes de completarlas.

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

Chromium recorre además Royal, Boho, Dark, Magnolia y Linen en Landing, RSVP y acceso Admin a 390 × 844 y
1440 × 900 px. Esta comprobación protege tema aplicado, fondo y ausencia de overflow; no sustituye la aprobación
artística manual de cada colección.

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
- `pnpm test` superó 50/50 pruebas unitarias y de integración;
- `pnpm build` generó el bundle de producción;
- la fase Chromium superó 23/23 recorridos;
- la fase de compatibilidad superó 36/36 recorridos;
- la matriz completa superó 59/59 recorridos;
- la comprobación temática de Landing, RSVP y Admin superó 10/10 combinaciones.

## Pendientes para cerrar Sprint 7.4

- aprobación visual manual de los cinco temas con contenido representativo y resolución de `DC-018`;
- contenido largo representativo en ES, EN y BG;
- navegación completa por teclado, zoom al 200 % y revisión asistida con lector de pantalla;
- estados autenticados de Admin con datos vacíos, largos, error y retry;
- Safari iOS y Chrome Android en dispositivos físicos;
- Lighthouse, Core Web Vitals y presupuesto real de fuentes y fondos;
- smoke test del despliegue representativo.

Hasta completar estos puntos, Sprint 7.4 permanece `En curso` y no se prepara `1.0.0`.

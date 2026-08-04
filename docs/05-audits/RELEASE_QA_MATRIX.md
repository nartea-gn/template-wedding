# Matriz de QA de release

## Estado

- **Sprint:** 7.4
- **Estado:** En curso
- **Fecha de ejecución:** 2026-08-04
- **Commit verificado:** `ad046d8`
- **Resultado automático:** 44/44 recorridos superados

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
| `chromium` | Desktop Chrome | Motor de escritorio | 12 | Correcto |
| `firefox` | Desktop Firefox | Motor de escritorio | 8 | Correcto |
| `webkit` | Desktop Safari | Aproximación al motor Safari | 8 | Correcto |
| `mobile-chrome` | Pixel 5 | Emulación Chrome Android | 8 | Correcto |
| `mobile-webkit` | iPhone 13 | Emulación Safari iOS | 8 | Correcto |

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

## Flujos cubiertos en todos los motores

- Landing carga contenido principal y navega a RSVP.
- El selector de mapas presenta sus tres proveedores.
- Los selectores de idioma y mapas gestionan foco inicial, teclado, Escape y retorno al trigger.
- El deadline cierra CTA y ruta RSVP sin ocultar Admin.
- RSVP negativo persiste mediante API interceptada y muestra éxito.
- RSVP afirmativo completa el recorrido multipaso.
- Un error de API conserva los datos y permite reintentar.
- Admin mantiene la lectura detrás del acceso por email.

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

## Evidencia complementaria

Sobre el mismo estado funcional:

- `pnpm lint` finalizó sin warnings;
- `pnpm test` superó 39/39 pruebas unitarias y de integración;
- `pnpm build` generó el bundle de producción;
- `pnpm test:e2e` superó 11/11 recorridos en Chromium;
- `pnpm test:e2e:matrix` superó 44/44 recorridos.

## Pendientes para cerrar Sprint 7.4

- matriz visual de los cinco temas en las páginas aplicables;
- ES, EN y BG, incluida invitación monolingüe y contenido largo;
- navegación completa por teclado, zoom al 200 % y revisión asistida con lector de pantalla;
- estados autenticados de Admin con datos vacíos, largos, error y retry;
- Safari iOS y Chrome Android en dispositivos físicos;
- Lighthouse, Core Web Vitals y presupuesto real de fuentes y fondos;
- smoke test del despliegue representativo.

Hasta completar estos puntos, Sprint 7.4 permanece `En curso` y no se prepara `1.0.0`.

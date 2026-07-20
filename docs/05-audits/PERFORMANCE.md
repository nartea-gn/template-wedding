# Performance Audit

## Estado verificado

- El vídeo principal se redujo de 12,5 MB a aproximadamente 4,56 MB, usa H.264/AAC y `faststart`.
- El poster WebP pesa aproximadamente 46 KB y reserva el ratio visual antes de reproducir.
- La invitación configura `preload: 'none'`; el MP4 se solicita bajo interacción.
- RSVP y Admin se cargan mediante `lazy` y tienen fallback localizado.
- Supabase queda detrás de routes/capabilities opcionales y Repository Pattern.
- El favicon se redujo de unos 15 MB a aproximadamente 375 KB.
- Las animaciones reducen trabajo con `prefers-reduced-motion`.
- Los catálogos secundarios se importan dinámicamente.

## Riesgos actuales

| Prioridad | Riesgo                                                        | Próxima acción                                                            |
|-----------|---------------------------------------------------------------|---------------------------------------------------------------------------|
| P1        | No existe baseline reproducible de Lighthouse/Core Web Vitals | Medir el deploy representativo en Sprint 7.4                              |
| P1        | Cambios visuales pueden alterar LCP/CLS                       | Registrar vídeo, poster, hero y fuentes en la matriz de QA                |
| P2        | Las fuentes de los cinco temas se declaran globalmente        | Medir bytes y uso antes de carga selectiva/self-hosting                   |
| P2        | Admin procesa, ordena y pagina en memoria                     | Migrar a servidor solo con volumen o latencia demostrados                 |
| P2        | Listas largas podrían aumentar coste de render                | Valorar `content-visibility` o virtualización únicamente con datos reales |

## Presupuestos y criterios

- Mantener poster por debajo de 150 KB salvo excepción documentada.
- Evitar precarga automática de vídeo pesado.
- Declarar dimensiones o ratio para medios y evitar CLS.
- Cargar rutas, catálogos y capabilities opcionales solo cuando se necesitan.
- No añadir librerías de iconos, motion o formatos sin comparar su coste.
- Fijar un objetivo numérico de Lighthouse solo después de obtener una baseline estable.

## Medición de Sprint 7.4

1. Ejecutar sobre un despliegue de producción representativo, sin cache caliente como única muestra.
2. Registrar móvil y escritorio por separado.
3. Medir LCP, CLS, INP, bytes transferidos y solicitudes de fuentes/vídeo.
4. Confirmar que el MP4 no se descarga antes de pulsar reproducir.
5. Comparar los cinco temas para detectar carga tipográfica innecesaria.
6. Documentar dispositivo, navegador, red, fecha y commit.

No se afirma una puntuación actual porque todavía no existe una medición reproducible registrada.

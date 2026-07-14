# Performance Audit

## Observaciones verificadas

- El vídeo local `src/assets/video.mp4` se reduce de 12,5 MB a aproximadamente 4,56 MB. Sprint 6.2 elimina la precarga
  automática, añade un poster WebP de unos 46 KB y la invitación actual declara `preload: 'none'`. La decodificación
  completa no presenta errores y el bloque `moov` precede a `mdat` para permitir reproducción progresiva.
- RSVP y Admin se cargan mediante `lazy`; Sprint 6.1 añade un fallback estable y localizado.
- La composición de Supabase queda detrás de rutas/capabilities opcionales y del contrato Repository.
- Las fuentes se declaran globalmente para los cinco temas. Su carga selectiva requiere ampliar el contrato de tema y
  queda registrada para Theme Engine v2, evitando una solución paralela provisional.
- El favicon de marca se redujo de 15 MB a aproximadamente 375 KB y sustituye correctamente al icono de Vite.
- `prefers-reduced-motion` reduce animación y transiciones; Sprint 6.1 acota propiedades animadas adicionales.

## Prioridades

1. Medir antes de fijar objetivos Lighthouse.
2. Verificar en navegador real que el MP4 no se solicita antes de la interacción y que el poster no introduce CLS.
3. Incorporar la carga tipográfica selectiva dentro de Theme Engine v2.
4. Auditar CLS, LCP e interacción en móvil real.
5. Mantener rutas opcionales lazy y evitar regresiones de inicialización de infraestructura.

No se afirma una puntuación actual porque no se ha ejecutado una medición reproducible en este sprint documental.

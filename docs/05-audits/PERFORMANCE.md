# Performance Audit

## Observaciones verificadas

- El vídeo local `src/assets/video.mp4` pesa 12,5 MB, usa `preload="auto"` y puede dominar transferencia y rendimiento
  percibido; es la prioridad de Sprint 6.2.
- RSVP y Admin se cargan mediante `lazy`; Sprint 6.1 añade un fallback estable y localizado.
- La composición de Supabase queda detrás de rutas/capabilities opcionales y del contrato Repository.
- Las fuentes se declaran globalmente para los cinco temas; su coste y estrategia se medirán en Sprint 6.2.
- `prefers-reduced-motion` reduce animación y transiciones; Sprint 6.1 acota propiedades animadas adicionales.

## Prioridades

1. Medir antes de fijar objetivos Lighthouse.
2. Definir política de vídeo: poster, preload, formato, tamaño y alternativa.
3. Cargar únicamente las familias tipográficas necesarias por estrategia acordada.
4. Auditar CLS, LCP e interacción en móvil real.
5. Mantener rutas opcionales lazy y evitar regresiones de inicialización de infraestructura.

No se afirma una puntuación actual porque no se ha ejecutado una medición reproducible en este sprint documental.

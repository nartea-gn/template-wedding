# Performance Audit

## Observaciones verificadas

- El vídeo local `src/assets/video.mp4` se incluye desde la aplicación y puede dominar transferencia y LCP percibido.
- Las tres rutas se importan estáticamente en `AppRouter.tsx`; RSVP y Admin entran en el bundle inicial.
- Supabase se crea al cargar su módulo y exige variables incluso en experiencias que en el futuro podrían no usar RSVP.
- Las fuentes se cargan globalmente desde `index.html` para varios temas.
- Las animaciones y transiciones globales no muestran todavía una estrategia de reducción de movimiento.

## Prioridades

1. Medir antes de fijar objetivos Lighthouse.
2. Cargar rutas opcionales de forma diferida.
3. Evitar inicializar adaptadores de capabilities desactivadas.
4. Definir política de vídeo: poster, preload, formato, tamaño y alternativa.
5. Cargar únicamente las familias tipográficas necesarias por estrategia acordada.
6. Auditar CLS, LCP e interacción en móvil real.

No se afirma una puntuación actual porque no se ha ejecutado una medición reproducible en este sprint documental.


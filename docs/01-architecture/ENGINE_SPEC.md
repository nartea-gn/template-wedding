# Engine Specification

El Engine recibe una definición válida y un registro tipado. Resuelve el orden y entrega a cada sección su
configuración. No carga datos, decide textos ni conoce Supabase.

`definition -> validation -> capabilities -> section resolution -> theme -> render`

## Reglas

- El orden visual coincide con `sections`.
- `enabled: false` elimina renderizado y efectos.
- Tipos desconocidos producen diagnóstico en desarrollo.
- Una sección recibe solo su configuración.
- La configuración no admite funciones, componentes ni consultas.
- Una capability desactivada no aporta rutas, CTA ni red.

El registro se ensambla fuera del Core. RSVP aporta formulario y persistencia mediante contratos; Admin puede consumir
sus respuestas. En v1 conserva la contraseña cliente actual.


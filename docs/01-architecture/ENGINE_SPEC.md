# Engine Specification

El Engine recibe una definición válida y un registro tipado. Resuelve el orden y entrega a cada sección su configuración. No carga datos, decide textos ni conoce Supabase.

La resolución pura permanece en los contratos Core. `InvitationRenderer` vive en `src/app/invitation` porque React es un
detalle de aplicación. El registro relaciona discriminantes con componentes; el renderer no importa dominios ni assets
concretos.

`definition -> validation -> capabilities -> section resolution -> theme -> render`

## Reglas

- El orden visual coincide con `sections`.
- `enabled: false` elimina renderizado y efectos.
- Tipos desconocidos producen diagnóstico en desarrollo.
- Una sección recibe solo su configuración.
- La configuración no admite funciones, componentes ni consultas.
- Una capability desactivada no aporta rutas, CTA ni red.
- Las secciones deshabilitadas no se montan y, por tanto, no crean hooks, intervalos o efectos.
- Los assets se resuelven en la composición de cada invitación mediante IDs serializables.

El registro se ensambla fuera del Core. RSVP aporta formulario y persistencia mediante contratos; Admin puede consumir sus respuestas. En v1 conserva la contraseña cliente actual.

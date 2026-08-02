# ADR-015 — Escritura pública RSVP sin lectura anónima

## Estado

Aceptado como política de producto. Los límites SQL exactos quedan condicionados al inventario remoto y a pruebas en
un entorno aislado.

## Contexto

El RSVP debe poder enviarse sin crear una cuenta. Esa comodidad no exige que las respuestas sean públicas ni que la
base acepte cualquier forma o tamaño de contenido.

## Decisión

- `anon` conserva únicamente la capacidad de insertar una respuesta compatible con el contrato público.
- `anon` no puede seleccionar, actualizar ni borrar respuestas.
- La lectura pertenece al usuario autenticado asignado a la invitación.
- Los límites de longitud, tipos, valores permitidos y tamaño de `answers` se aplicarán también en base de datos.
- El slug no se considera un secreto ni una credencial.
- CAPTCHA o una Edge Function se añadirán solo si el abuso real o los requisitos operativos lo justifican.

## Controles previstos

- restricciones de longitud para nombre, identificadores, idioma y textos libres;
- valores permitidos para asistencia, transporte y opciones conocidas;
- `answers` debe ser un objeto JSON con tamaño limitado;
- versión de formulario positiva y campos técnicos coherentes;
- errores de cliente sin payloads personales;
- pruebas con cliente anónimo para operaciones permitidas y denegadas.

La allowlist definitiva de invitaciones y cualquier estrategia anti-replay se decidirán después de conocer el modelo
remoto y los casos reales. No se introducirá infraestructura preventiva sin evidencia.

## Consecuencias

- El RSVP permanece rápido y sin registro.
- RLS deja de utilizarse como sustituto de validación de dominio.
- Un bot aún podría intentar insertar respuestas válidas; se observará y escalará la protección cuando sea necesario.
- Los límites deberán evolucionar junto al Form Engine y su contrato público.

## Señales que activan una revisión

- volumen anómalo de inserciones;
- coste o ruido operativo medible;
- repetición automatizada sobre una invitación;
- necesidad de corregir una respuesta existente;
- incorporación de campos de mayor sensibilidad;
- cambio de proveedor o arquitectura de persistencia.

## Fuentes

- [Supabase: Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Supabase: CAPTCHA protection](https://supabase.com/docs/guides/auth/auth-captcha)

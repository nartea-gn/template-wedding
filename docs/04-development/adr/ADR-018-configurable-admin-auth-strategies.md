# ADR-018 — Estrategias configurables de autenticación Admin

## Estado

Aceptado.

## Contexto

ADR-014 adoptó OTP por email para sustituir la antigua contraseña global incluida en el bundle. Algunas invitaciones
necesitan evitar la dependencia del correo en cada acceso, manteniendo la misma sencillez y la autorización real por
invitación.

## Decisión

Cada `InvitationDefinition` con Admin habilitado declara exactamente una estrategia:

```ts
auth: {method: 'otp'}
```

o:

```ts
auth: {method: 'password'}
```

Ambas estrategias autentican identidades reales mediante Supabase Auth. La UI solo presenta el método declarado antes
del despliegue. `invitation_admins` y RLS siguen siendo la única autoridad que determina qué respuestas puede leer la
sesión autenticada.

La estrategia `password` usa email y contraseña de cada identidad. La contraseña nunca pertenece a
`InvitationDefinition`, variables `VITE_*`, código, documentación de ejemplo ni logs. No se recupera la contraseña
global compartida descartada por ADR-014.

## Provisionamiento

Los emails y membresías se cargan mediante una operación Node explícita que usa `SUPABASE_SECRET_KEY` fuera del
navegador. El comando es idempotente, no revoca usuarios y exige seleccionar `--local` o `--production`.

En OTP puede crear identidades confirmadas que todavía no existan. En password solo asigna identidades existentes: la
contraseña inicial se establece privadamente desde Supabase Dashboard hasta disponer de un flujo de invitación o
recuperación propio.

## Consecuencias

- cambiar `admin.auth.method` selecciona el formulario sin duplicar el panel;
- restauración de sesión, logout, Repository y RLS son comunes;
- OTP continúa siendo la configuración de referencia;
- password reduce la dependencia habitual de SMTP, pero requiere rotación y recuperación operativas;
- cambiar de método no revoca automáticamente sesiones activas;
- errores de credenciales permanecen deliberadamente neutros;
- no se necesita una migración SQL adicional.

## Validación

- el contrato rechaza Admin sin un método admitido;
- OTP conserva solicitud, verificación y reenvío;
- password usa `signInWithPassword` y no compara secretos en React;
- cada variante muestra únicamente sus controles;
- una sesión sin membresía no puede leer respuestas;
- repetir el provisionamiento no duplica usuarios ni membresías.

## Fuentes

- [Supabase JavaScript: signInWithPassword](https://supabase.com/docs/reference/javascript/auth-signinwithpassword)
- [Supabase JavaScript: signInWithOtp](https://supabase.com/docs/reference/javascript/auth-signinwithotp)
- [Supabase: Managing users](https://supabase.com/docs/guides/auth/users)
- [ADR-014 — OTP por email y autorización administrativa](./ADR-014-admin-email-otp-authorization.md)

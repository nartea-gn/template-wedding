# ADR-014 — OTP por email y autorización administrativa por invitación

## Estado

Aceptado para implementación incremental. La auditoría remota de Sprint 7.1 confirma que todavía no existen usuarios,
membresías ni políticas autenticadas, por lo que la transición puede introducirse sin migrar identidades previas.

ADR-018 amplía esta decisión permitiendo seleccionar OTP o email y contraseña por invitación. No modifica la decisión
central de autenticar con Supabase Auth y autorizar exclusivamente mediante membresías y RLS.

## Contexto

`/admin` sirve para que la pareja consulte asistencia, logística y mensajes. No necesita identidad social, jerarquías
empresariales ni un panel complejo de usuarios. Sí necesita impedir que una persona anónima o una pareja distinta lea
respuestas ajenas.

La implementación actual compara `VITE_ADMIN_PASSWORD` dentro del navegador y guarda `admin_authed` en
`sessionStorage`. Esto oculta la interfaz, pero no autoriza la consulta: Supabase permite actualmente `SELECT` anónimo
global y el filtro por `wedding_slug` no es una frontera de seguridad.

## Alternativas consideradas

### Mantener una contraseña compartida

Es sencilla, pero el secreto entra en el bundle, se comparte entre personas y no permite revocación individual ni RLS
basada en identidad. Descartada.

### Magic Link por email

Tiene una interacción mínima, pero depende de redirecciones y puede ser consumido por sistemas de previsualización o
seguridad del correo. Sigue siendo una alternativa futura válida.

### OTP de seis dígitos por email

El usuario permanece en la misma pantalla, funciona bien con GitHub Pages y rutas hash, no requiere contraseña y evita
los problemas de prefetch de enlaces. Elegida.

### MFA, OAuth o proveedor propio

Añaden complejidad que el riesgo y el uso actual no justifican. Fuera de alcance.

## Decisión

Adoptar Supabase Auth con OTP por email como autenticación primaria y RLS como única autoridad de lectura.

El flujo será:

1. Nartea provisiona manualmente en Supabase Auth los emails autorizados.
2. `/admin` solicita email y llama a `signInWithOtp` con `shouldCreateUser: false`.
3. La pantalla solicita el código de seis dígitos y lo valida mediante `verifyOtp` con tipo `email`.
4. El cliente deriva su estado de `getSession` y `onAuthStateChange`; no usa una bandera local de autoridad.
5. Supabase persiste y renueva la sesión mediante su cliente estándar.
6. Una acción visible ejecuta `signOut`.
7. RLS decide qué filas puede seleccionar el usuario autenticado.

## Modelo de autorización

Se incorporará una relación mínima, conceptualmente equivalente a:

```text
invitation_admins
├── invitation_id
└── user_id -> auth.users.id
```

La combinación será única. Una política `SELECT TO authenticated` permitirá leer una respuesta únicamente cuando exista
una membresía cuyo `invitation_id` coincida con `rsvp_responses.wedding_slug` y cuyo `user_id` sea
`auth.uid()`.

No habrá `SELECT` para `anon`. Conocer el slug o inspeccionar el JavaScript no concede acceso.

## Experiencia de usuario

- Primer acceso: email, código de seis dígitos y entrada al panel.
- Accesos posteriores: sesión persistente mientras siga siendo válida.
- Error: mensaje neutro que no confirma si un email está registrado.
- Reenvío: espera visible y límites de frecuencia.
- Cierre: botón de salir accesible desde Admin.
- Dispositivo compartido: recomendación clara de cerrar sesión.

## Operación inicial

Nartea crea, asigna y revoca usuarios manualmente. No se construirá una interfaz de gestión de usuarios en v1. El
procedimiento deberá registrar qué invitación recibe cada usuario y verificar la revocación.

## Consecuencias

- Se elimina `VITE_ADMIN_PASSWORD` del contrato y del workflow.
- Admin necesitará estados de carga, solicitud, verificación, error, reenvío, sesión y cierre.
- El Repository y Core no necesitan una reescritura; el cliente Supabase adjunta el JWT a la consulta existente.
- La seguridad dependerá de políticas versionadas y probadas, no de componentes React.
- La entrega de email y los límites de Auth pasan a ser dependencias operativas.

## Validación obligatoria

- `anon` no puede leer;
- usuario no asignado no puede leer;
- pareja A solo puede leer invitación A;
- pareja B solo puede leer invitación B;
- email no provisionado no crea usuario;
- sesión restaurada funciona tras recargar;
- `signOut` retira el acceso del cliente;
- los estados del formulario son accesibles y no enumeran usuarios.

## Fuentes

- [Supabase: Passwordless email logins](https://supabase.com/docs/guides/auth/auth-email-passwordless)
- [Supabase JavaScript: signInWithOtp](https://supabase.com/docs/reference/javascript/auth-signinwithotp)
- [Supabase: Email templates](https://supabase.com/docs/guides/auth/auth-email-templates)
- [Supabase: Sessions](https://supabase.com/docs/guides/auth/sessions)
- [Supabase: Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)

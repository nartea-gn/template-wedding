# Operación del acceso Admin

## Objetivo

Provisionar, asignar y revocar el acceso de una pareja sin almacenar contraseñas en el frontend ni conceder permisos
globales sobre respuestas RSVP.

## Modelo

- Supabase Auth identifica a la persona mediante OTP por email.
- `invitation_admins` relaciona su `user_id` con una invitación.
- RLS autoriza la lectura; conocer el email o el slug no concede acceso.
- El cliente usa `shouldCreateUser: false` y nunca crea cuentas.

Una llamada externa podría solicitar crear una cuenta mientras el proveedor de email está habilitado. Esa cuenta no
recibe acceso a respuestas: sin una membresía privilegiada en `invitation_admins`, RLS devuelve cero filas. Un hook
previo al alta o CAPTCHA se añadirá solo si existe abuso medido.

## Configuración inicial del proyecto alojado

1. Mantén habilitado el proveedor de email; desactivarlo también impide el OTP de usuarios existentes.
2. Configura el OTP de email con seis dígitos y 300 segundos de caducidad.
3. En la plantilla **Magic Link**, sustituye el enlace por `{{ .Token }}` y adapta el contenido de
   `supabase/templates/magic_link.html`.
4. Configura un remitente y SMTP adecuados antes de atender clientes reales.
5. Envía un código a una cuenta de prueba y comprueba entrega, spam, caducidad y reenvío.

El correo OTP utiliza una identidad corporativa única de **NarteaGN**, independiente del tema visual de la invitación.
Esta decisión mantiene una señal de confianza estable en una comunicación de seguridad y evita que el acceso dependa de
metadatos temáticos. Los correos emocionales o comerciales podrán adoptar el tema de cada invitación cuando exista un
caso de uso específico.

Al copiar la plantilla al proyecto alojado, conserva:

- el asunto `Tu código de acceso a NarteaGN`;
- el token `{{ .Token }}` sin transformaciones;
- la caducidad comunicada de cinco minutos, alineada con los 300 segundos de configuración;
- la estructura basada en tablas y los estilos inline para compatibilidad entre clientes de correo;
- y la ausencia de imágenes, fuentes o recursos remotos necesarios para comprender el mensaje.

La configuración de `supabase/config.toml` y la plantilla HTML solo gobiernan el entorno local. El proyecto alojado se
configura desde Supabase Dashboard o su Management API; no se sincroniza mediante migraciones SQL.

### Compatibilidad del correo

La plantilla utiliza una estructura híbrida para correo electrónico:

- tablas de presentación y estilos inline como base;
- `background-color` acompañado de `bgcolor` como respaldo para clientes antiguos;
- ancho CSS fluido en móvil y atributo HTML de 520 píxeles como respaldo para Outlook de escritorio;
- tipografías instaladas habitualmente, sin descargas externas;
- y bordes redondeados como mejora progresiva, nunca necesarios para comprender o utilizar el OTP.

Aunque `bgcolor` se considera obsoleto en HTML web moderno, se conserva deliberadamente como respaldo compatible con
clientes de correo que no interpretan CSS de forma completa. También se evita depender de comentarios condicionales,
porque Supabase los elimina al procesar la plantilla. El correo no necesita sombras, imágenes, JavaScript, formularios
ni recursos remotos.

### Despliegue en Supabase alojado

El workflow de despliegue aplica migraciones SQL, pero no publica la configuración Auth ni las plantillas de correo. Para
cada proyecto alojado:

1. copia el asunto y el contenido de `supabase/templates/magic_link.html` en **Authentication → Email Templates → Magic Link**;
2. configura un OTP de seis dígitos y `300` segundos de caducidad;
3. comprueba que el proveedor de email permanece habilitado;
4. solicita un código con una identidad ficticia provisionada;
5. verifica entrega, remitente, spam, caducidad y acceso limitado por RLS.

La Management API permite automatizar más adelante `mailer_otp_exp`, asunto y plantilla. Esa automatización no forma
parte de esta entrega para evitar introducir credenciales administrativas o complejidad antes de necesitar varios
proyectos alojados.

### Deuda técnica: dominio y SMTP propios

El remitente productivo personalizado queda aplazado hasta disponer de un dominio verificado. La deuda incluye:

- elegir un proveedor SMTP transaccional;
- definir una dirección exclusiva de autenticación;
- configurar `smtp_sender_name` como `NarteaGN` y `smtp_admin_email` con la dirección verificada;
- publicar SPF, DKIM y DMARC;
- mantener usuario y contraseña SMTP fuera de Git;
- y completar una prueba real en Gmail, Outlook y Apple Mail.

Hasta cerrar esta deuda, Mailpit seguirá mostrando localmente el nombre `NarteaGN` mediante `[local_smtp]`, pero el proyecto no se considerará
preparado para entregar emails de autenticación a clientes reales. Los proyectos Free creados desde el 3 de junio de
2026 necesitan además SMTP propio para utilizar plantillas Auth personalizadas; la situación concreta del proyecto
alojado deberá verificarse antes del despliegue.

## Alta de una pareja

1. Crea el usuario desde **Authentication → Users** mediante una operación administrativa.
2. Copia su UUID; no guardes tokens ni claves de sesión.
3. Confirma que el ID de invitación coincide exactamente con `InvitationDefinition.id`.
4. Ejecuta con privilegios operativos:

```sql
INSERT INTO public.invitation_admins (invitation_id, user_id)
VALUES ('identificador-de-invitacion', 'uuid-del-usuario')
ON CONFLICT DO NOTHING;
```

5. Solicita un OTP desde `#/admin` y comprueba que solo aparecen respuestas de esa invitación.
6. Registra la asignación en el sistema operativo interno autorizado, nunca en Git.

## Añadir una segunda persona

Crea otro usuario y añade otra fila para la misma invitación. No compartas una cuenta entre varias personas: las
identidades independientes permiten revocar una sin afectar a la otra.

## Revocar acceso

Primero elimina la membresía:

```sql
DELETE FROM public.invitation_admins
WHERE invitation_id = 'identificador-de-invitacion'
  AND user_id = 'uuid-del-usuario';
```

Después elimina o bloquea el usuario Auth si no administra ninguna otra invitación. Comprueba con una sesión nueva que
ya no puede leer respuestas. Las sesiones existentes dejan de autorizar filas en cuanto desaparece la membresía.

## Verificación mínima por release

- un email no provisionado no crea usuario;
- una pareja asignada entra con OTP y conserva la sesión tras recargar;
- una persona sin membresía ve cero respuestas;
- dos parejas no pueden cruzar invitaciones;
- cerrar sesión retira el JWT del cliente;
- el email no confirma si una dirección está registrada;
- ningún log, captura o artefacto contiene emails, códigos o respuestas reales.

## Incidencias

- **No llega el código:** revisar SMTP, plantilla Magic Link, rate limits y carpeta de spam.
- **Llega un enlace:** la plantilla alojada todavía usa `{{ .ConfirmationURL }}` en vez de `{{ .Token }}`.
- **Código rechazado:** comprobar los seis dígitos, caducidad y que se usa el último envío.
- **Panel vacío:** comprobar la membresía y que `invitation_id` coincide con `wedding_slug`.
- **Acceso excesivo:** retirar la membresía, conservar evidencias sin datos personales y revisar RLS antes de continuar.

## Validación local reproducible

El 2026-08-03 se reconstruyó una instalación vacía mediante Supabase CLI `2.111.0` sobre Docker y se comprobó:

- aplicación correcta de las migraciones `20260712` y `20260802`;
- RLS habilitada en `rsvp_responses` e `invitation_admins`;
- lectura anónima rechazada por la API con `401`;
- inserción anónima válida aceptada con `201` usando el payload completo del formulario;
- usuario asignado limitado a `gala-y-valentin`;
- usuario autenticado sin membresía con cero respuestas visibles;
- correo desconocido con respuesta visual neutra y sin mensaje generado;
- plantilla OTP capturada en Mailpit con seis dígitos y caducidad de cinco minutos;
- restauración de sesión tras recarga y cierre de sesión efectivo;
- `supabase db lint --level warning` sin errores.

La prueba utilizó únicamente identidades y respuestas ficticias. El proyecto alojado no se enlazó ni modificó.

## Fuentes

- [Supabase: Email templates](https://supabase.com/docs/guides/auth/auth-email-templates)
- [Supabase: Local email templates](https://supabase.com/docs/guides/local-development/customizing-email-templates)
- [Supabase JavaScript: signInWithOtp](https://supabase.com/docs/reference/javascript/auth-signinwithotp)
- [Runbook de migración RSVP](../01-architecture/RSVP_SECURITY_MIGRATION_RUNBOOK.md)

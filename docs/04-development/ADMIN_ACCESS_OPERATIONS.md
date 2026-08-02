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
2. Configura el OTP de email con seis dígitos y 600 segundos de caducidad.
3. En la plantilla **Magic Link**, sustituye el enlace por `{{ .Token }}` y adapta el contenido de
   `supabase/templates/magic_link.html`.
4. Configura un remitente y SMTP adecuados antes de atender clientes reales.
5. Envía un código a una cuenta de prueba y comprueba entrega, spam, caducidad y reenvío.

La configuración de `supabase/config.toml` y la plantilla HTML solo gobiernan el entorno local. El proyecto alojado se
configura desde Supabase Dashboard o su Management API; no se sincroniza mediante migraciones SQL.

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

## Fuentes

- [Supabase: Email templates](https://supabase.com/docs/guides/auth/auth-email-templates)
- [Supabase: Local email templates](https://supabase.com/docs/guides/local-development/customizing-email-templates)
- [Supabase JavaScript: signInWithOtp](https://supabase.com/docs/reference/javascript/auth-signinwithotp)
- [Runbook de migración RSVP](../01-architecture/RSVP_SECURITY_MIGRATION_RUNBOOK.md)

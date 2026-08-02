# Runbook de migración de seguridad RSVP

## Objetivo

Aplicar la migración de seguridad y el acceso OTP como una única release verificable, sin exponer respuestas durante un
rollback ni perder datos existentes.

## Regla de despliegue

`20260802_secure_rsvp_admin_access.sql` no se fusiona ni despliega sin el frontend OTP correspondiente. La migración
elimina la lectura anónima; desplegarla sola convertiría `/admin` en un panel sin acceso válido.

La PR permanece en borrador hasta que:

- OTP y sesión estén implementados;
- exista al menos un usuario de prueba asignado;
- la matriz anónimo/asignado/no asignado pase;
- producto confirme `pnpm lint` y `pnpm build`;
- backup y responsable de despliegue estén confirmados.

## Preparación

1. Confirmar que el backup administrado de Supabase está disponible para el proyecto o crear una exportación cifrada
   siguiendo el procedimiento operativo aprobado.
2. No descargar ni adjuntar respuestas RSVP a la PR o a los logs.
3. Confirmar que el email OTP está configurado y que los emails autorizados se provisionan con
   `shouldCreateUser: false` en el cliente.
4. Registrar las membresías necesarias en `invitation_admins` mediante una operación privilegiada.
5. Conservar el commit exacto que contiene migración y frontend.

## Despliegue

El workflow de `main` debe:

1. validar la aplicación;
2. aplicar migraciones pendientes;
3. detenerse si la migración falla;
4. desplegar el frontend del mismo commit;
5. ejecutar smoke tests sin mostrar datos personales.

## Verificación posterior

- la migración `20260802` consta como aplicada;
- no existe política `SELECT` para `anon` sobre `rsvp_responses`;
- `anon` conserva únicamente INSERT en las columnas públicas;
- `authenticated` conserva SELECT sin INSERT/UPDATE/DELETE;
- `service_role` conserva permisos operativos;
- el asesor de seguridad no informa políticas permisivas ni ejecución pública de `rls_auto_enable()`;
- una pareja asignada accede únicamente a su invitación;
- un usuario no asignado ve un estado vacío o denegado sin datos;
- el RSVP público sigue aceptando un envío válido.

## Recuperación

La estrategia preferida es **roll-forward**.

### Falla el frontend después de aplicar la migración

No restaurar la lectura anónima. Corregir o redesplegar el frontend OTP. Mientras tanto, la información permanece segura
y puede gestionarse mediante una operación privilegiada controlada.

### Un constraint rechaza un caso legítimo

Crear una migración correctiva que relaje únicamente el límite afectado. No eliminar todas las restricciones ni la RLS.

### Una membresía es incorrecta

Corregir `invitation_admins` mediante operación privilegiada. No modificar la política para acomodar un dato erróneo.

### La migración falla antes de completar

PostgreSQL revierte la transacción de migración. Investigar la causa, comprobar el historial remoto y publicar una
migración correctiva. No usar `migration repair` sin reconciliar primero esquema e historial.

### Pérdida o corrupción de datos

Detener escrituras y seguir el procedimiento de restauración del proveedor desde el backup confirmado. Esta situación
no se resuelve revirtiendo políticas.

## Acciones prohibidas

- reactivar `anon SELECT` como solución temporal;
- exponer `service_role` en Vite;
- editar el esquema remoto desde Dashboard durante el despliegue;
- ejecutar `db reset` o `migration repair` contra producción;
- guardar exports con datos personales en Git o artefactos públicos;
- aplicar manualmente solo una parte de la release.

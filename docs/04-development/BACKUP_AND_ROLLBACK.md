# Backup, rollback y fallo parcial

Qué hacer cuando un despliegue sale mal, y qué hay que tener preparado **antes** para poder hacerlo.

Cierra la última casilla obligatoria de [`RELEASE_CHECKLIST.md`](./RELEASE_CHECKLIST.md).

## Qué se puede perder, y qué no

| | Dónde vive | Recuperable |
|---|---|---|
| Respuestas de los invitados | `rsvp_responses` en Supabase | **Solo desde un backup.** Es el único dato irreemplazable del producto |
| Rastro de auditoría | `admin_audit` | Solo desde un backup |
| Esquema y migraciones | `supabase/migrations/` en git | Sí, siempre |
| Frontend | Build determinista desde un commit | Sí, siempre |
| Edge Function | `supabase/functions/` en git | Sí, siempre |
| Usuarios de Admin | `auth.users` + membresías | Reprovisionables con `admin:provision` |

Todo lo de la mitad de abajo se reconstruye desde el repositorio. **Lo de arriba no**, y ese es el
único sitio donde el pánico está justificado.

## El despliegue no es atómico

`deploy.yml` hace, en este orden:

```
lint · db:verify · deriva de schema.sql · E2E chromium · build
        ↓
aplicar migraciones pendientes en remoto     ← primer paso irreversible
        ↓
sincronizar la fecha de la boda (sync-invitation)
        ↓
desplegar la Edge Function
        ↓
publicar en Cloudflare Pages
        ↓
smoke test contra la URL pública             ← ya desplegado
```

Las migraciones se aplican **antes** de que el frontend esté publicado. Entre esos dos pasos hay una
ventana en la que la base está en la versión nueva y la web en la vieja, y esa ventana es el fallo
parcial más probable de todos.

**Por eso las migraciones tienen que ser compatibles hacia atrás con el frontend anterior.** Añadir
columnas, tablas y funciones lo es; renombrar y borrar no. Si un cambio no puede serlo, va en dos
despliegues: primero el que añade, luego el que retira.

## Antes de cualquier release

1. **Comprobar que hay backup y de cuándo.** Supabase mantiene backups automáticos según el plan
   del proyecto; en el plan gratuito la ventana es corta y puede no existir. Hay que saber cuál es
   **antes** de necesitarlo, no después.
2. **Sacar una copia propia del dato irreemplazable.** Es una orden y cabe en un fichero:

   ```bash
   pg_dump "$SUPABASE_DB_URL" \
     --data-only --table=public.rsvp_responses --table=public.admin_audit \
     --file="rsvp-$(date +%Y%m%d-%H%M).sql"
   ```

   Guardarlo **fuera** del repositorio: contiene nombres, alergias y mensajes de los invitados.
   Alergias son datos del artículo 9. Ver
   [`DATA_PRIVACY_INVENTORY.md`](../05-audits/DATA_PRIVACY_INVENTORY.md).
3. **Anotar el commit que está publicado.** Es al que se vuelve.

## Rollback del frontend

Es el caso fácil y no toca la base.

- **Desde Cloudflare Pages:** el despliegue anterior sigue ahí. *Deployments* → el anterior →
  *Rollback*. Segundos, y sin pasar por CI.
- **Desde el repositorio:** `git revert` del merge y dejar que `deploy.yml` publique. Más lento,
  pero deja el historial contando lo que pasó.

Lo primero para parar la hemorragia; lo segundo para que el repositorio no mienta.

## Rollback de la base

**No existe un `supabase db rollback`.** Las migraciones son sólo hacia adelante. Hay tres salidas,
por orden de preferencia:

**1 · Migración compensatoria.** Escribir una migración nueva que deshaga lo que hizo la mala, y
desplegarla. Es lo correcto en casi todos los casos: el historial queda completo y reproducible, que
es lo que `db:verify` comprueba en cada PR. Un `DROP` de lo que se añadió, un `UPDATE` que restaura
lo que se cambió.

**2 · Restaurar desde backup.** Solo si se ha perdido dato, no si el esquema quedó raro. Pierde todo
lo escrito desde el backup — **incluidas respuestas de invitados**, que no se pueden pedir otra vez.
Antes de hacerlo hay que valorar cuánto se pierde.

**3 · Reparar a mano.** Solo con fallo acotado y entendido, y **después** de un `pg_dump`. La
casilla del checklist que dice «no se han realizado cambios manuales fuera del historial aprobado»
deja de ser cierta en cuanto se toca: hay que escribir después la migración que deja el esquema
donde el historial dice que está, o el siguiente `db:verify` fallará y tendrá razón.

## Fallo parcial: migraciones aplicadas, frontend sin publicar

Es el estado que deja el pipeline si falla entre el paso 80 y el 123.

1. **No relanzar el workflow a ciegas.** Las migraciones son idempotentes (`IF NOT EXISTS`) y
   reaplicarlas no rompe, pero si el fallo fue *en* una migración, el estado remoto está a medias.
2. **Mirar dónde quedó:** `pnpm exec supabase migration list --linked` dice qué hay aplicado allí y
   qué aquí.
3. Si las migraciones están completas y solo faltó publicar, **publicar**. La base nueva con el
   frontend viejo funciona si se respetó la compatibilidad hacia atrás.
4. Si una migración quedó a medias, **migración compensatoria** y volver a desplegar.

## Lo que este documento no cubre

- **Cloudflare Pages no tiene dato que restaurar**: sirve un build, y el build sale de un commit.
- **La purga automática no es un fallo, es el diseño.** Las respuestas se borran **siete días después
  de la boda** (`20260901_add_invitations_purge.sql`), con aviso por correo días antes
  (`20260903_add_purge_warning.sql`). Un backup tomado después de esa fecha **no contiene nada**, y
  restaurar uno anterior reintroduce datos que el aviso de privacidad prometió borrar. No se hace.
- **Quién responde.** El checklist tiene su propia casilla para eso y sigue sin asignar. Un
  procedimiento sin nombre detrás se ejecuta tarde.

## Comprobarlo antes de necesitarlo

Un procedimiento que nunca se ha ejecutado no es un procedimiento. Antes de `1.0.0`, y contra un
proyecto Supabase de pruebas, no contra el real:

1. Aplicar las migraciones desde cero — `db:verify` ya lo hace en cada PR.
2. Tomar un `pg_dump` de las dos tablas con datos de prueba dentro.
3. Borrar una fila, restaurarla desde el dump, comprobar que vuelve.
4. Escribir una migración compensatoria de mentira y comprobar que `db:verify` sigue verde después.

El paso 3 es el único que este documento no puede dar por hecho, y es el que importa.

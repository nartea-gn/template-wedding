# ADR-020 — Rastro de auditoría administrativa que muere con los datos que describe

## Estado

Aceptado e implementado en Sprint 7.5A (`20260905_add_admin_audit.sql`).

## Contexto

Una invitación puede tener varios administradores. Desde Sprint 7.1D el panel permite editar, borrar y restaurar
respuestas, y desde 7.4B ajustar el plazo del RSVP. Ninguna de esas operaciones dejaba rastro: una respuesta que
cambiaba o desaparecía no permitía reconstruir quién lo hizo ni cuándo, y el borrado es irreversible en cuanto la purga
se ejecuta.

La tensión que gobierna esta decisión no es técnica. `purge_all_expired_rsvp()` borra las respuestas siete días después
de la boda, y ese plazo está escrito dentro del aviso del artículo 13 que el invitado lee al rellenar el formulario.
Es una declaración formal ante el interesado, no una promesa comercial. Cualquier registro que sobreviva a la purga y
siga hablando de esa respuesta es una conservación que nadie declaró.

## Decisión

**Lo escriben triggers, no el navegador.** `record_rsvp_response_audit()` se dispara `AFTER UPDATE` sobre
`rsvp_responses` y lee `auth.uid()` de la petición que provocó el cambio.

**La acción se deriva del estado, no de lo que diga quien llama.** Se calcula desde la transición de `deleted_at`:
`NULL → valor` es `deleted`, `valor → NULL` es `restored`, y cualquier otro cambio es `updated`. Un borrado blando no
puede registrarse como una edición.

**Los envíos anónimos no se auditan.** Un invitado rellenando el formulario no es una mutación administrativa.

**No se guarda contenido del invitado.** Ni nombres, ni respuestas, ni valores anteriores. Solo la referencia a la
fila, la boda, la acción, el autor y el instante.

**El rastro muere con la respuesta.** `response_id` es una clave foránea `ON DELETE CASCADE`, así que la purga se lo
lleva con los datos que describe.

**Nadie puede modificarlo.** RLS activo con una única política de `SELECT`, para los administradores de esa boda. No
existe política de `INSERT`, `UPDATE` ni `DELETE`; escriben los triggers, que corren como propietarios.

**Los cambios de plazo se registran contra la invitación**, sin `response_id`. No contienen datos de invitados y no los
barre la purga.

Los `REVOKE` nombran `anon` y `authenticated` además de `PUBLIC`, porque los privilegios por defecto de Supabase
conceden `EXECUTE` directamente a esos roles y un grant directo sobrevive a un revoke de `PUBLIC`. Es el mismo fallo
que dejó abierta la fuga descrita en el hallazgo 7 de [`CIERRE_REVIEW.md`](../../CIERRE_REVIEW.md).

## Alternativas descartadas

**Escribir el rastro desde el cliente.** Se puede omitir, reordenar o saltar hablando con la API directamente, y el
autor que declara es autodeclarado. Un rastro que depende de la buena fe del cliente no sirve para lo único que se le
pide: contar qué pasó cuando alguien niega haberlo hecho.

**Guardar los valores anteriores para poder deshacer.** Sería una segunda base de datos con restricciones alimentarias
—categoría especial del artículo 9— fuera del inventario, del aviso al invitado y de la purga. El coste de privacidad
es desproporcionado frente a un «deshacer» que el borrado blando ya cubre mientras la respuesta existe.

**Conservar el rastro más allá de la purga.** Es la alternativa que más se pidió y la que está expresamente rechazada:
contradiría el plazo declarado al interesado. Si algún día una obligación contractual exige conservarlo, hay que
cambiar antes el aviso del artículo 13, no la clave foránea.

**Tabla append-only con política de `INSERT` para administradores.** Conceder escritura a `authenticated` permite
fabricar entradas. Sin política de escritura, el único camino es el trigger.

## Consecuencias

- Tras la purga no se puede saber quién borró una respuesta. Es la consecuencia buscada: la privacidad del invitado
  pesa más que la trazabilidad frente al cliente.
- El rastro no tiene interfaz. Es consultable por los administradores vía RLS; mostrarlo es trabajo futuro y no
  requiere cambios de esquema.
- `actor_id` es dato personal de un administrador, no de un invitado. Se rige por la relación contractual con el
  cliente, no por el aviso del artículo 13, y por eso las entradas de invitación sobreviven a la purga.
- Añadir a esta tabla cualquier contenido del invitado rompe el modelo: la cascada protege la referencia, no una copia.
- `supabase/local/99-verify.sql` comprueba el ciclo completo y **falla si el rastro sobrevive a la purga**. La
  restricción está fijada por una prueba, no solo por un comentario.

## Señales que activan una revisión

- una obligación legal o contractual de conservar el rastro más tiempo que los datos;
- mutaciones administrativas nuevas que hoy no pasan por `UPDATE` sobre `rsvp_responses`, como borrados masivos o
  exportaciones;
- una interfaz que muestre el historial y exija nombres legibles en vez de identificadores;
- un cambio del plazo de conservación, que obliga a revisar el aviso antes que el esquema;
- más de un responsable del tratamiento por invitación.

## Fuentes

- [RGPD, artículo 5.1.e — limitación del plazo de conservación](https://eur-lex.europa.eu/legal-content/ES/TXT/HTML/?uri=CELEX:32016R0679#d1e1807-1-1)
- [PostgreSQL: Trigger functions](https://www.postgresql.org/docs/current/plpgsql-trigger.html)
- [Supabase: Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)

# Inventario de datos y privacidad RSVP

## Estado

- **Fecha:** 2026-08-02
- **Fase:** Sprint 7.1, investigación
- **Alcance:** captura, almacenamiento, consulta y exportación de respuestas RSVP
- **Nota:** guía de diseño y operación; no sustituye asesoramiento jurídico

## Datos tratados actualmente

| Dato                             |  Obligatorio | Finalidad de producto               | Destino        | Observación                                               |
|----------------------------------|-------------:|-------------------------------------|----------------|-----------------------------------------------------------|
| Nombre completo                  |           Sí | Identificar la respuesta            | Supabase y CSV | Dato personal directo.                                    |
| Asistencia                       |           Sí | Planificación del evento            | Supabase y CSV | Se conserva también en `answers`.                         |
| Consentimiento dietético         |           Sí | Base legal de los datos de salud    | Supabase       | Art. 9.2.a. Elegir es obligatorio; consentir no.          |
| Restricciones alimentarias       |           No | Menú y seguridad del invitado       | Supabase y CSV | **Categoría especial (art. 9).** Solo con consentimiento explícito. |
| Detalle alimentario libre        |           No | Resolver necesidades no previstas   | Supabase       | **Categoría especial (art. 9).** Texto libre: cabe cualquier diagnóstico. |
| Opción de autobús                |           No | Logística de transporte             | Supabase y CSV | Necesidad temporal ligada al evento.                      |
| Canción solicitada               |           No | Personalización musical             | Supabase y CSV | Texto libre.                                              |
| Mensaje                          |           No | Comunicación personal con la pareja | Supabase y CSV | Texto libre y potencialmente imprevisible.                |
| Invitación, formulario y versión | Sí, técnicos | Separación y trazabilidad           | Supabase       | No deben conceder autoridad por sí solos.                 |
| Idioma                           |  Sí, técnico | Interpretación de la respuesta      | Supabase       | Minimizar su uso fuera del formulario.                    |
| Fecha de creación                |   Automático | Orden y operación                   | Supabase       | Necesaria para gestión y retención.                       |
| Rastro de auditoría administrativa |  Automático | Trazabilidad de cambios del panel   | Supabase       | Referencia a la respuesta y al administrador; **sin contenido del invitado**. Se borra con la respuesta. |

No se solicitan actualmente email, teléfono, dirección postal, documento de identidad ni datos de pago a los invitados.

## Información al invitado y retención

- El formulario muestra el aviso del artículo 13 en **todos** sus pasos, compuesto con el responsable declarado en
  `controller`: quién trata los datos, para qué, cuánto se conservan, con quién se comparten y cómo ejercer derechos.
- Los datos dietéticos van detrás de un consentimiento explícito. «Prefiero no decirlo» es una respuesta válida que
  deja pasar el formulario, así que el consentimiento es **libre**, y queda constancia de la negativa.
- Revocar el consentimiento **borra** las respuestas dietéticas del envío: un campo oculto ya no viaja con el resto.
- `form_version` se persiste con cada fila y sube cada vez que cambia el texto del consentimiento o del aviso; es lo
  que permite saber a qué redacción consintió cada invitado.
- La retención se calcula desde la fecha de boda (`invitations.event_date_utc + 7 días`) y la ejecuta un trabajo
  nocturno, no el navegador de nadie. Los administradores reciben aviso por correo antes del borrado, irreversible.

**Advertencia operativa:** el plazo de siete días ya está escrito dentro de un aviso del artículo 13, así que ha
dejado de ser una promesa comercial para ser una declaración formal ante el interesado. No publicar ninguna invitación
con invitados reales hasta que el cron de purga esté activo en el proyecto Supabase de destino.

### Rastro de auditoría administrativa

Decisión completa y alternativas descartadas en
[`ADR-020`](../04-development/adr/ADR-020-admin-audit-trail.md).

`admin_audit` registra qué hizo un administrador sobre una respuesta —editarla, borrarla o restaurarla— y cuándo, con
el `auth.uid()` de la sesión que lo hizo. Lo escriben triggers, no el navegador: un registro que el cliente pueda
omitir o falsear no es un registro.

Tres decisiones que lo mantienen dentro de lo declarado al invitado:

- **No guarda contenido del invitado.** Ni nombres, ni respuestas, ni valores anteriores. Solo la referencia a la fila,
  la boda, la acción y el autor. Copiar valores aquí sería crear una segunda base de datos de categorías especiales
  fuera de toda declaración; la clave foránea protege la referencia, no una copia.
- **Muere con la respuesta.** La clave foránea es `ON DELETE CASCADE`, así que la purga de los siete días se lleva el
  rastro con los datos que describe. Una fila de auditoría que sobreviviera a la purga reintroduciría una conservación
  que el aviso del artículo 13 no menciona. El banco de pruebas local lo comprueba y falla si deja de ser cierto.
- **Nadie puede editarlo.** La tabla tiene RLS con una única política de `SELECT` para los administradores de esa boda.
  No existe política de `INSERT`, `UPDATE` ni `DELETE`: escriben los triggers, que corren como propietarios.

Las entradas de cambio de plazo se registran contra la invitación, no contra ninguna respuesta. No contienen datos de
invitados y por eso no las barre la purga; sí contienen el identificador del administrador, que es dato personal del
cliente y se rige por la relación contractual, no por el aviso del artículo 13.

## Duplicación actual

Durante la compatibilidad, varios valores viven tanto en columnas legacy como dentro de `answers` JSONB. Esta
duplicación facilita la transición, pero aumenta superficie de mantenimiento y borrado. Sprint 7.1 no la eliminará sin
una migración y una decisión de compatibilidad explícitas.

## Acceso aprobado

| Actor                             |           Inserción |            Lectura |        Exportación |               Administración |
|-----------------------------------|--------------------:|-------------------:|-------------------:|-----------------------------:|
| Invitado anónimo                  |        Sí, limitada |                 No |                 No |                           No |
| Usuario autenticado sin membresía |                  No |                 No |                 No |                           No |
| Pareja asignada                   |      No por defecto | Solo su invitación | Solo su invitación |  Consulta y cierre de sesión |
| Operación técnica autorizada      | Según procedimiento |    Según necesidad |        Excepcional | Provisionar o revocar acceso |

## Principios aplicables

- **Finalidad:** usar cada dato únicamente para gestionar el evento y la respuesta.
- **Minimización:** no añadir campos por conveniencia futura.
- **Acceso mínimo:** una pareja solo accede a su invitación.
- **Conservación limitada:** no mantener respuestas indefinidamente por defecto.
- **Integridad y confidencialidad:** RLS, sesiones y secretos de despliegue protegen el acceso.
- **Transparencia:** el formulario deberá explicar responsable, finalidad, conservación y canal de derechos.

## Decisiones pendientes de negocio o revisión jurídica

Antes de fijar textos y plazos definitivos hay que confirmar:

1. quién actúa como responsable del tratamiento en cada producto: la pareja, NarteaGN Digital u otra relación;
2. la base jurídica adecuada;
3. el plazo operativo tras el evento;
4. el canal para acceso, corrección o borrado;
5. si existe un contrato de encargado del tratamiento y qué proveedores deben constar;
6. qué texto informativo debe mostrarse en el RSVP.

Hasta resolverlo, no se declarará un plazo legal inventado. Como criterio técnico, el sistema deberá permitir configurar
y ejecutar el borrado por invitación.

## Propuesta operativa para validar

- El acceso comienza cuando Nartea provisiona los emails de la pareja.
- La pareja puede exportar su información mientras la invitación está activa.
- Tras el evento se aplica un periodo configurable y explícito de cierre.
- Al finalizarlo se exporta, anonimiza o borra según la decisión contractual.
- La revocación elimina la membresía administrativa sin borrar accidentalmente las respuestas.
- Toda copia CSV queda bajo custodia de quien la descarga y debe eliminarse cuando deje de ser necesaria.

## Requisitos de implementación derivados

- Borrado por `wedding_slug` mediante operación privilegiada y auditable, no desde el cliente anónimo.
- Límites de longitud y forma para todos los campos, especialmente texto libre y JSONB.
- Ningún payload RSVP en `console.log`, errores de UI o logs de CI.
- Consulta administrativa limitada a columnas necesarias; revisar el actual `select('*')`.
- Política y documentación coherentes para columnas legacy y `answers`.
- Texto de privacidad enlazado antes de enviar el formulario.

## Fuentes

- [RGPD, artículo 5: principios relativos al tratamiento](https://eur-lex.europa.eu/legal-content/ES/TXT/?uri=CELEX%3A32016R0679)
- [AEPD: protección de datos por defecto](https://www.aepd.es/derechos-y-deberes/cumple-tus-deberes/medidas-de-cumplimiento/proteccion-de-datos-por-defecto)
- [AEPD: principios de protección de datos](https://www.aepd.es/derechos-y-deberes/cumple-tus-deberes/principios)

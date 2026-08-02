# Inventario de datos y privacidad RSVP

## Estado

- **Fecha:** 2026-08-02
- **Fase:** Sprint 7.1, investigación
- **Alcance:** captura, almacenamiento, consulta y exportación de respuestas RSVP
- **Nota:** guía de diseño y operación; no sustituye asesoramiento jurídico

## Datos tratados actualmente

| Dato | Obligatorio | Finalidad de producto | Destino | Observación |
|---|---:|---|---|---|
| Nombre completo | Sí | Identificar la respuesta | Supabase y CSV | Dato personal directo. |
| Asistencia | Sí | Planificación del evento | Supabase y CSV | Se conserva también en `answers`. |
| Restricciones alimentarias | No | Menú y seguridad del invitado | Supabase y CSV | Tratar de forma conservadora por su posible sensibilidad. |
| Detalle alimentario libre | No | Resolver necesidades no previstas | Supabase | Puede revelar más información de la necesaria. |
| Opción de autobús | No | Logística de transporte | Supabase y CSV | Necesidad temporal ligada al evento. |
| Canción solicitada | No | Personalización musical | Supabase y CSV | Texto libre. |
| Mensaje | No | Comunicación personal con la pareja | Supabase y CSV | Texto libre y potencialmente imprevisible. |
| Invitación, formulario y versión | Sí, técnicos | Separación y trazabilidad | Supabase | No deben conceder autoridad por sí solos. |
| Idioma | Sí, técnico | Interpretación de la respuesta | Supabase | Minimizar su uso fuera del formulario. |
| Fecha de creación | Automático | Orden y operación | Supabase | Necesaria para gestión y retención. |

No se solicitan actualmente email, teléfono, dirección postal, documento de identidad ni datos de pago a los invitados.

## Duplicación actual

Durante la compatibilidad, varios valores viven tanto en columnas legacy como dentro de `answers` JSONB. Esta
duplicación facilita la transición, pero aumenta superficie de mantenimiento y borrado. Sprint 7.1 no la eliminará sin
una migración y una decisión de compatibilidad explícitas.

## Acceso aprobado

| Actor | Inserción | Lectura | Exportación | Administración |
|---|---:|---:|---:|---:|
| Invitado anónimo | Sí, limitada | No | No | No |
| Usuario autenticado sin membresía | No | No | No | No |
| Pareja asignada | No por defecto | Solo su invitación | Solo su invitación | Consulta y cierre de sesión |
| Operación técnica autorizada | Según procedimiento | Según necesidad | Excepcional | Provisionar o revocar acceso |

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

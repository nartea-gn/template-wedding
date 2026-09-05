# Frontend Audit

## Estado actual

La aplicación tiene una arquitectura pequeña, tipada y proporcionada a su alcance. React 19, Router 7, TypeScript 7,
Vite 8 y Tailwind 4 conviven con límites claros entre Core, Features, Infrastructure, Design System e Invitation. No se
justifica una reescritura ni una extracción prematura a monorepo o plugins.

## Fortalezas verificadas

- `InvitationDefinition` gobierna evento, localización, tema, secciones y capabilities.
- Section Registry controla orden y visibilidad sin condicionales repartidos por Landing.
- Form Engine es declarativo, versionado, localizado y neutral respecto del evento.
- `RsvpRepository` separa UI y dominio de Supabase.
- El mapper DB ↔ dominio está centralizado en infraestructura.
- RSVP y Admin son rutas lazy y opcionales.
- Theme Engine v2 emite Custom Properties desde un contrato TypeScript completo.
- Rutas reales (`/`, `/rsvp`, `/admin`) desde [`ADR-022`](../04-development/adr/ADR-022-real-paths-routing.md): `HashRouter` leía `#main-content` como ruta y rompía el enlace de salto. El fallback lo da Cloudflare Pages sin `_redirects`, y `pnpm smoke:test` lo vigila. El `base` pasó a la raíz.
- Los catálogos secundarios EN/BG se cargan bajo demanda.

## Hallazgos actuales

| Prioridad | Hallazgo                                   | Evidencia                                                   | Acción                                                          |
|-----------|--------------------------------------------|-------------------------------------------------------------|-----------------------------------------------------------------|
| P0        | Lectura RSVP anónima global                | `supabase/schema.sql` permite `SELECT TO anon USING (true)` | Diseñar autoridad por invitación y RLS en Sprint 7.1            |
| P0        | Admin protegido solo en UI                 | `VITE_ADMIN_PASSWORD` se compara en el navegador            | Aprobar autenticación/operación server-side antes de mutaciones |
| P0        | Historial DB no crea una instalación vacía | La primera migración incremental presupone la tabla         | Auditar remoto y diseñar baseline segura                        |
| P1        | No existe suite de pruebas                 | `package.json` no contiene script `test`                    | Elegir stack y cobertura en Sprint 7.2                          |
| P1        | No hay CI de pull requests                 | Workflow solo escucha push a `main`                         | Añadir gates de PR tras aprobar la estrategia de pruebas        |
| P1        | Configuración sin consumidor completo      | `seo`, `deadline` y fechas duplicadas                       | Implementar o retirar en Sprint 7.3                             |
| P1        | Versión declara `1.0.0` antes del release  | `package.json` frente al roadmap                            | Resolver versionado en la release candidate                     |
| P1        | Herramientas de CI parcialmente flotantes  | Supabase CLI usa `latest`                                   | Fijar versiones y política de actualización                     |
| P2        | Fuentes declaradas globalmente             | Cinco parejas tipográficas disponibles en CSS               | Medir carga selectiva antes de optimizar                        |

## Hallazgos resueltos desde la auditoría inicial

- RSVP monolítico → Form Engine y aplicación RSVP separada.
- Supabase acoplado a hooks → Repository Pattern y adaptador.
- Rutas siempre activas → capabilities y lazy loading.
- Orden visual fijo → Section Registry.
- Contrato monolingüe → runtime Core con ES/EN/BG.
- Tokens parciales → Theme Engine v2.
- README de Vite → documentación real del producto.

## Riesgos de evolución

- No generalizar el motor para dominios que todavía no existen.
- No permitir componentes o callbacks arbitrarios dentro de temas.
- No extender Admin a CRM antes de proteger datos y operaciones.
- No introducir una baseline retrospectiva sin comprobar el historial remoto.
- No optimizar consultas, bundles o fuentes sin una medición reproducible.

## Próxima revisión

Repetir la auditoría después de Sprint 7.3. Debe incluir dependencias, tamaño de bundles, ciclos de importación,
cobertura, contratos no consumidos y consistencia de versiones.

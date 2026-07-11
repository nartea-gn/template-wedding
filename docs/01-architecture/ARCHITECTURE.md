# Architecture

## Estado actual

`main.tsx -> ThemeProvider -> AppRouter -> Landing | Rsvp | Admin`. `Landing` consume `weddingConfig`; `Rsvp` y `Admin` llegan a Supabase mediante hooks que importan el cliente directamente.

Ya existe contenido centralizado en `src/config/wedding.config.ts` y un sistema de temas tipado en `src/design`. Sin embargo, las rutas son fijas, `Landing.tsx` decide el orden, `Rsvp.tsx` define las preguntas y los textos visibles no tienen todavía un contrato de localización.

## Capas objetivo

| Capa | Responsabilidad | No conoce |
| --- | --- | --- |
| `app` | Arranque, providers, routing y composición | Reglas de una invitación concreta |
| `core` | Contratos, validación y renderer | Bodas, Supabase o estilos concretos |
| `design` | Tokens, temas y primitivas | Negocio o persistencia |
| `features` | Capacidades verticales | Proveedores externos directos |
| `infrastructure` | Supabase, auth y despliegue | Composición visual |
| `invitations` | Definiciones y contenido | Renderizado o persistencia |
| `shared` | Utilidades transversales | Features o invitaciones |

La localización cruza `invitations`, `core` y `app`: la invitación declara locales y catálogos; el Core define contratos de resolución; `app` gestiona el locale activo y sincroniza el documento. Las features reciben contenido resuelto y nunca importan catálogos de una invitación concreta.

## Dependencias

`invitations -> core contracts`; `features -> core + design`; `infrastructure -> contracts`; `app` compone todas. El Core nunca importa features.

Se conservan `HashRouter` y `/template-wedding/` para GitHub Pages. Las rutas RSVP/Admin solo existirán cuando sus capabilities estén activas.

## Migración

1. Tokens TypeScript sin cambiar UI.
2. Actualizar React 19 y React Router 7; evaluar TypeScript 7 con puerta de compatibilidad.
3. Adaptar configuración a `InvitationDefinition`, incluyendo localización.
4. Introducir resolución de catálogos y selector opcional.
5. Renderer mínimo y migración sección a sección.
6. RSVP configurable y Supabase en infraestructura.
7. Admin compuesto solo con dependencias activas.

No habrá dos aplicaciones ni una carpeta `legacy` permanente.

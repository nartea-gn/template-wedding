# Frontend Audit

## Resumen

La base es pequeña y comprensible, con TypeScript, Vite, HashRouter, configuración central y temas tipados. La deuda
principal no es el tamaño, sino la mezcla de composición, contenido e infraestructura.

## Fortalezas

- `wedding.config.ts` centraliza pareja, fecha, localizaciones, slug y tema.
- `ThemeProvider` aplica un contrato de tokens tipado.
- Admin ya está dividido en componentes de presentación.
- `HashRouter` y `base` son apropiados para GitHub Pages.
- Los mapeos snake_case/camelCase son explícitos.

## Hallazgos prioritarios

| Prioridad | Hallazgo                           | Evidencia                                                        | Acción                                                               |
|-----------|------------------------------------|------------------------------------------------------------------|----------------------------------------------------------------------|
| Alta      | RSVP fijo y monolítico             | `Rsvp.tsx` supera 17 KB y contiene preguntas, pasos y validación | Diseñar Form Engine declarativo                                      |
| Alta      | Supabase acoplado a hooks          | `useRsvp.ts`, `useAdminData.ts`                                  | Introducir repositorios y adaptador                                  |
| Alta      | Capabilities no controlan rutas    | `AppRouter.tsx` siempre registra RSVP/Admin                      | Composición condicional                                              |
| Alta      | Contenido parcialmente hardcodeado | `Landing.tsx`, `Rsvp.tsx`, componentes Admin                     | Mover textos a definiciones                                          |
| Media     | Orden visual fijado en página      | `Landing.tsx`                                                    | Section registry y renderer                                          |
| Media     | Tokens duplican fuentes de verdad  | `themes/index.ts`, `index.css`, `patterns.css`                   | Tokens TypeScript y salida CSS coherente                             |
| Media     | Tipos ligados a RSVP de boda       | `types/rsvp.ts`                                                  | Separar definición de campos y respuestas                            |
| Baja      | README sigue siendo el de Vite     | `README.md`                                                      | Reescribir después de estabilizar contratos                          |
| Media     | Textos sin contrato multilenguaje  | Páginas y componentes contienen literales                        | Introducir localización en `InvitationDefinition` antes de migrarlos |

## Riesgo conocido

La contraseña se compara en el navegador y RLS permite lectura anónima global. Es alcance aceptado para v1, no seguridad
robusta. Debe comunicarse así y evolucionar en un ADR posterior.

## Quick wins del siguiente sprint

Crear tokens TypeScript, eliminar duplicación de tipos de tema, añadir zona horaria/locale a configuración y definir
flags estructurados para RSVP/Admin antes de mover componentes.

## Baseline moderno solicitado

El proyecto parte de React 18, React Router 6 y TypeScript 5. La dirección aprobada es React 19.2 y React Router 7.
TypeScript 7 es preferente, pero requiere validar compilador, `typescript-eslint`, Vite, editor y definiciones de tipos
en conjunto. La migración será un hito independiente para no mezclar incompatibilidades con el Engine.

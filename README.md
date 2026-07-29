# Nartea Invitation Engine

Motor configurable para crear experiencias digitales de eventos. La boda actual es la primera implementación: el Core
resuelve localización, secciones, formularios y temas sin contener reglas específicas de bodas ni dependencias de
Supabase.

## Estado del proyecto

El producto está en fase previa a `1.0.0`. La experiencia pública, RSVP, Admin opcional, localización y Theme Engine v2
están implementados. Seguridad de datos, baseline reproducible de Supabase, pruebas automáticas y QA de release siguen
siendo puertas obligatorias antes de publicar una versión estable.

Consulta el [roadmap](docs/00-product/ROADMAP.md), el [backlog](docs/00-product/PRODUCT_BACKLOG.md) y el
[checklist de release](docs/04-development/RELEASE_CHECKLIST.md) para conocer el estado exacto.

## Stack

- React 19 y React Router 7.
- TypeScript 7 para compilación, con TypeScript 6 side-by-side para compatibilidad de ESLint.
- Vite 8 y Tailwind CSS 4 con configuración CSS-first.
- Supabase mediante un adaptador de infraestructura.
- GitHub Pages con `HashRouter` y base `/template-wedding/`.
- pnpm como único gestor de paquetes; `pnpm-lock.yaml` es autoritativo.

## Puesta en marcha

### Requisitos

- Node.js compatible con el pipeline del repositorio.
- pnpm.
- Un proyecto Supabase preparado con el esquema y las migraciones del repositorio.

### Instalación

```powershell
git clone <repository-url>
Set-Location template-wedding
pnpm install --frozen-lockfile
Copy-Item .env.example .env
```

Completa `.env` sin subirlo a Git:

```dotenv
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_ADMIN_PASSWORD=choose-a-local-password
```

Las variables con prefijo `VITE_` forman parte del bundle público. `VITE_ADMIN_PASSWORD` solo proporciona una barrera
de interfaz temporal; no es autenticación segura ni protege directamente la API de Supabase.

### Desarrollo

```powershell
pnpm dev
```

Vite selecciona un puerto disponible. Las rutas principales son:

- `#/`: invitación pública;
- `#/rsvp`: confirmación, solo si RSVP está habilitado;
- `#/admin`: panel de respuestas, solo si RSVP y Admin están habilitados.

### Gates locales

```powershell
pnpm lint
pnpm build
pnpm preview
```

`pnpm build` ejecuta primero el compilador TypeScript y después Vite. El repositorio no tiene todavía un framework de
pruebas configurado.

## Configurar una invitación

La definición actual vive en `src/invitations/wedding/invitation.ts`. Desde allí se controla:

- identificador y datos del evento;
- tema;
- idioma predeterminado, idiomas disponibles y selector;
- orden y visibilidad de secciones;
- preguntas del formulario RSVP;
- activación y controles de Admin.

Los catálogos están en `src/invitations/wedding/locales`, los temas en `src/design/themes`, los activos en
`src/invitations/wedding/assets.ts` y la composición de secciones en `src/invitations/wedding/sectionRegistry.tsx`.

La guía completa está en [CONFIGURATION_GUIDE.md](docs/04-development/CONFIGURATION_GUIDE.md). Para preparar vídeo y
poster, consulta [MEDIA_WORKFLOW.md](docs/04-development/MEDIA_WORKFLOW.md).

## Arquitectura

```text
Invitation Definition
        ↓
App composition → Core contracts → Features
        ↓                          ↓
Theme / localization        Repository contracts
                                   ↓
                            Infrastructure / Supabase
```

Reglas fundamentales:

- la configuración describe qué se muestra; el motor decide cómo se renderiza;
- el Core no conoce bodas ni Supabase;
- las Features dependen de contratos, no de proveedores;
- el Theme controla identidad visual, nunca contenido o capabilities;
- los textos visibles se resuelven mediante claves localizadas;
- una invitación nueva no debe requerir modificar el Core.

Documentos de referencia:

- [Visión](docs/00-product/PRODUCT_VISION.md)
- [Principios](docs/00-product/PRODUCT_PRINCIPLES.md)
- [Arquitectura](docs/01-architecture/ARCHITECTURE.md)
- [Invitation Definition](docs/01-architecture/INVITATION_DEFINITION.md)
- [Form Engine](docs/01-architecture/FORMS.md)
- [Internacionalización](docs/01-architecture/INTERNATIONALIZATION.md)
- [Theme Engine](docs/02-design/THEMES.md)
- [Backgrounds temáticos](docs/02-design/BACKGROUNDS.md)
- [Admin](docs/01-architecture/ADMIN.md)
- [Migraciones](docs/01-architecture/DATABASE_MIGRATIONS.md)
- [Architecture Decision Records](docs/04-development/adr)

## Despliegue

Un push a `main` ejecuta `.github/workflows/deploy.yml`: instala dependencias, valida lint/build, aplica migraciones
pendientes y despliega el artefacto en GitHub Pages. Los secretos de Supabase y Admin se configuran en GitHub Actions.

El pipeline actual no sustituye una revisión de seguridad. El esquema v1 permite inserción y lectura anónimas y la
contraseña Admin se valida en el navegador. No debe considerarse apto para datos personales sensibles hasta completar
el Sprint 7.1 y el checklist de release.

## Historial

Los cambios consolidados y las limitaciones conocidas se registran en [CHANGELOG.md](CHANGELOG.md).

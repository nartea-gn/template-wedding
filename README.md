# Nartea Invitation Engine

Motor configurable para crear experiencias digitales de eventos. La boda actual es la primera implementación: el Core
resuelve localización, secciones, formularios y temas sin contener reglas específicas de bodas ni dependencias de
Supabase.

## Estado del proyecto

El producto está en fase previa a `1.0.0`. La experiencia pública, RSVP, Admin opcional, localización, Theme Engine v2,
el baseline visual responsive y la base local de seguridad están implementados. Sprint 7.2 incorpora pruebas automáticas
y quality gates de Pull Request. Privacidad operativa, despliegue alojado y QA de release siguen siendo puertas
obligatorias antes de publicar una versión estable.

Consulta el [roadmap](docs/00-product/ROADMAP.md), el [backlog](docs/00-product/PRODUCT_BACKLOG.md) y el
[plan de Sprint 7](docs/00-product/SPRINT_7_PLAN.md). El
[checklist de release](docs/04-development/RELEASE_CHECKLIST.md) mantiene las puertas verificables para `1.0.0`.

## Stack

- React 19 y React Router 7.
- TypeScript 7 para compilación, con TypeScript 6 side-by-side para compatibilidad de ESLint.
- Vite 8 y Tailwind CSS 4 con configuración CSS-first.
- Supabase mediante un adaptador de infraestructura.
- Vitest, React Testing Library, Playwright y pgTAP para validación por capas.
- GitHub Pages con `HashRouter` y base `/template-wedding/`.
- pnpm 10.34.5 como único gestor de paquetes; `pnpm-lock.yaml` es autoritativo.

## Puesta en marcha

### Requisitos

- Node.js 24.
- Corepack y pnpm 10.34.5.
- Docker Desktop para Supabase local y las pruebas de base de datos.
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
```

Las variables con prefijo `VITE_` forman parte del bundle público. No incluyas claves `service_role`, contraseñas de
base de datos ni otros secretos privilegiados. Admin usa OTP por email y la autorización se aplica mediante RLS.

### Desarrollo

```powershell
pnpm dev
```

Vite selecciona un puerto disponible. Las rutas principales son:

- `#/`: invitación pública;
- `#/rsvp`: confirmación, solo si RSVP está habilitado y dentro de plazo;
- `#/admin`: panel de respuestas, solo si RSVP y Admin están habilitados.

### Gates locales

```powershell
pnpm lint
pnpm test
pnpm build
pnpm test:e2e
pnpm preview
```

`pnpm build` ejecuta primero el compilador TypeScript y después Vite. `pnpm test:e2e` inicia automáticamente la
aplicación y requiere instalar Chromium una vez mediante `pnpm exec playwright install chromium`. Las pruebas RLS se
ejecutan contra Supabase local con `pnpm test:db`. Consulta la [estrategia de pruebas](docs/04-development/TESTING.md).

## Configurar una invitación

La definición actual vive en `src/invitations/wedding/invitation.ts`. Desde allí se controla:

- identificador y datos del evento;
- fecha/hora con offset, timezone, SEO localizado y deadline RSVP;
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
- [Operación del acceso Admin](docs/04-development/ADMIN_ACCESS_OPERATIONS.md)
- [Migraciones](docs/01-architecture/DATABASE_MIGRATIONS.md)
- [Estrategia de pruebas](docs/04-development/TESTING.md)
- [Architecture Decision Records](docs/04-development/adr)
- [Plan de Sprint 7](docs/00-product/SPRINT_7_PLAN.md)
- [Modelo de amenazas](docs/05-audits/SECURITY_THREAT_MODEL.md)
- [Inventario de datos y privacidad](docs/05-audits/DATA_PRIVACY_INVENTORY.md)
- [Auditoría de baseline de Supabase](docs/05-audits/SUPABASE_BASELINE_AUDIT.md)

## Despliegue

Un push a `main` ejecuta `.github/workflows/deploy.yml`: instala dependencias, valida lint/build, aplica migraciones
pendientes y despliega el artefacto en GitHub Pages. Los secretos operativos de Supabase se configuran en GitHub Actions
y nunca llegan al bundle.

El pipeline no sustituye la revisión de seguridad. La release de Sprint 7.1 debe publicar conjuntamente la migración RLS
y el frontend OTP, provisionar los usuarios autorizados y completar el checklist de release.

## Historial

Los cambios consolidados y las limitaciones conocidas se registran en [CHANGELOG.md](CHANGELOG.md).

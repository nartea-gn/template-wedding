# ADR-016 — Stack de pruebas y quality gates

## Estado

Aceptado en Sprint 7.2. Las capas de aplicación y base de datos se ejecutaron de forma reproducible en local y en la
Pull Request `#20`, sin datos personales ni dependencia de Supabase alojado.

## Contexto

El proyecto dispone de `lint` y `build`, pero todavía no cuenta con pruebas automatizadas. Esto deja sin protección
ejecutable los contratos que sostienen las invitaciones: configuración, localización, formularios, mappers, Repository,
capabilities y los flujos públicos y administrativos.

El stack actual es React 19, TypeScript, Vite 8, pnpm y Supabase. La solución debe integrarse con estas herramientas,
ejecutarse en Windows durante el desarrollo y permanecer reproducible en GitHub Actions sobre Linux.

## Riesgos que deben cubrirse

1. Una configuración inválida llega al renderer.
2. Un catálogo incompleto rompe un idioma o su fallback.
3. Una regla condicional del formulario muestra, valida o envía campos incorrectos.
4. El mapper interpreta de forma distinta filas legacy y actuales.
5. Un adaptador incumple el contrato de `RsvpRepository`.
6. Una capability deshabilitada conserva rutas o llamadas que no deberían existir.
7. Landing, RSVP o Admin dejan de completar su recorrido principal.
8. Una regresión de RLS expone respuestas o cruza invitaciones.

## Alternativas para pruebas unitarias y de integración

### Vitest

Comparte resolución, transformaciones y configuración con Vite, soporta TypeScript y ESM directamente y ofrece cobertura
V8. Reduce configuración duplicada y permite probar el Core en entorno Node y componentes en `jsdom`.

### Jest

Es una solución madura, pero en este proyecto requeriría mantener una transformación y configuración paralelas a Vite,
especialmente para ESM y TypeScript. No aporta una ventaja suficiente para justificar esa segunda ruta de compilación.

### Solo pruebas en navegador

Vitest Browser Mode puede ejecutar componentes en navegadores reales, pero solapa parte del propósito de Playwright y
añade un proveedor adicional. Se aplaza hasta que exista una necesidad de componentes que `jsdom` no pueda representar.

## Alternativas para pruebas end-to-end

### Playwright

Ofrece aislamiento por contexto, servidor web gestionado, Chromium, Firefox y WebKit, emulación móvil, trazas y una
integración directa con GitHub Actions. Permite mantener los recorridos independientes y probar rutas hash sin modificar
la aplicación.

### Cypress

Proporciona una experiencia interactiva excelente y reintentos automáticos. Para este proyecto, Playwright encaja mejor
con la matriz posterior de Safari/WebKit, varios navegadores y dispositivos definida para Sprint 7.4, sin introducir una
segunda herramienta de QA visual.

## Decisión

Adoptar un stack por capas:

| Capa                    | Herramienta                             | Responsabilidad                                                     |
|-------------------------|-----------------------------------------|---------------------------------------------------------------------|
| Unitarias               | Vitest en entorno Node                  | Validadores, utilidades, localización, presentación y mappers puros |
| Integración React       | Vitest, `jsdom` y React Testing Library | Form Engine, providers, estados y composición accesible             |
| Contrato de adaptadores | Vitest con dobles tipados               | Comportamiento del Repository sin red ni credenciales               |
| Base de datos           | pgTAP mediante Supabase CLI local       | Migraciones, grants, RLS y aislamiento por invitación               |
| End-to-end              | Playwright Test                         | Landing, RSVP, Admin y ausencia de rutas por capability             |

No se conectarán las pruebas de Pull Request a Supabase alojado. Los datos serán ficticios y cada capa deberá poder
reconstruirse desde el repositorio.

## Estrategia de Supabase

- Los mappers y consumidores del Repository se prueban con objetos y dobles tipados.
- La implementación `SupabaseRsvpRepository` se prueba contra un cliente doble que verifique consulta, filtros y
  errores.
- Las políticas RLS no se simulan en JavaScript: se validan mediante pgTAP sobre Supabase local después de aplicar todas
  las migraciones.
- Los recorridos E2E públicos interceptan la API cuando el objetivo es validar UI. La autenticación Admin alojada queda
  fuera del workflow de Pull Request; su autorización real se cubre en la capa SQL y en la verificación de release.
- Ninguna prueba usa emails, códigos OTP o respuestas reales.

## Alcance inicial de navegadores

El gate rápido de cada Pull Request ejecutará Playwright en Chromium de escritorio. WebKit, Firefox y la matriz móvil
completa se reservan para el gate programado o manual de Sprint 7.4, evitando triplicar el coste de cada cambio antes de
tener una suite estabilizada.

Esto no reduce el soporte esperado del producto. Separa una señal rápida de regresión de la matriz exhaustiva de
release.

## Versiones y reproducibilidad

- Node se fija en la línea 24 utilizada por desarrollo y despliegue.
- pnpm se fija inicialmente en `10.34.5`, conservando el major ya usado por GitHub Actions.
- Las dependencias de prueba se registran en `package.json` y `pnpm-lock.yaml`.
- Playwright instala únicamente Chromium en el gate rápido.
- Supabase CLI deberá fijar una versión explícita; no se utilizará `latest` en quality gates.
- Los artefactos de pruebas y cobertura no se versionan.

## Scripts previstos

```text
pnpm test             # Vitest en modo run
pnpm test:watch       # Vitest durante desarrollo
pnpm test:coverage    # Cobertura V8 informativa
pnpm test:e2e         # Playwright Chromium
pnpm test:db          # pgTAP sobre Supabase local
pnpm quality          # lint, unitarias y build
```

El workflow utilizará comandos explícitos para que un fallo detenga el job. `quality` no ocultará ni continuará después
de un error.

## Umbrales y cobertura

Sprint 7.2 no impondrá un porcentaje global arbitrario. Primero cubrirá los riesgos enumerados y publicará el informe de
cobertura para localizar huecos. Un umbral podrá añadirse cuando exista una baseline estable y no incentive pruebas sin
valor.

## Coste operativo estimado

| Gate                                     |   Objetivo inicial | Frecuencia                                               |
|------------------------------------------|-------------------:|----------------------------------------------------------|
| Instalación, lint, unitarias y build     | menos de 3 minutos | Toda Pull Request                                        |
| E2E Chromium                             | menos de 3 minutos | Toda Pull Request                                        |
| Migraciones y pgTAP local                | menos de 5 minutos | Toda Pull Request que afecte datos; inicialmente siempre |
| Matriz Chromium, Firefox, WebKit y móvil |   hasta 10 minutos | Release o ejecución programada                           |

Los tiempos son objetivos de diseño y deberán medirse en la primera ejecución alojada antes de considerarlos baseline.

## Consecuencias

- Aparecen dependencias y configuración específicas de prueba, pero no cambian el bundle productivo.
- Los contratos puros permanecen fáciles de probar sin React ni Supabase.
- Los tests E2E se centran en comportamiento visible y evitan selectores ligados a estilos.
- La base de datos requiere Docker en local y en el job correspondiente.
- El workflow de despliegue deja de ser el primer lugar donde se detectan regresiones.
- La futura matriz completa reutiliza Playwright sin migrar suites.

## Criterios de aceptación

- al menos una prueba representativa de cada capa elegida;
- cobertura mínima por riesgo del plan de Sprint 7.2;
- ejecución local reproducible desde una instalación limpia;
- workflow de Pull Request que bloquee lint, unitarias, build y E2E;
- prueba SQL que demuestre que `anon` no lee y dos invitaciones no se cruzan;
- documentación operativa con comandos, límites y resolución de fallos;
- versiones fijadas sin acciones ni CLI configuradas como `latest`.

## Fuentes

- [Vitest: Getting Started](https://vitest.dev/guide/)
- [Vitest: Coverage](https://vitest.dev/guide/coverage)
- [Testing Library: React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Playwright: Installation](https://playwright.dev/docs/intro)
- [Playwright: Web server](https://playwright.dev/docs/test-webserver)
- [Playwright: Browsers](https://playwright.dev/docs/browsers)
- [Playwright: Continuous Integration](https://playwright.dev/docs/ci)
- [Supabase: Testing and linting](https://supabase.com/docs/guides/local-development/cli/testing-and-linting)
- [Cypress: End-to-end testing](https://docs.cypress.io/app/end-to-end-testing/writing-your-first-end-to-end-test)
- [Jest: Getting Started](https://jestjs.io/docs/getting-started)

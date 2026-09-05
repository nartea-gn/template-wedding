# Dependencias y herramientas

## Qué pertenece al manifiesto

`package.json` declara únicamente lo que el producto necesita para ejecutarse o para construirse
y probarse. Nada de lo que asista a quien escribe el código entra ahí: no lo consume el bundle, no
lo consume CI y añade superficie de cadena de suministro a cambio de nada.

`dependencies` a fecha de este documento son cuatro: `@supabase/supabase-js`, `react`, `react-dom`
y `react-router-dom`.

## Tres paquetes fantasma, retirados el 4 de septiembre de 2026

`gsap`, `impeccable` y `taste-skill` estaban declarados como **dependencias de runtime** con cero
imports en todo el repositorio, workflows de CI incluidos. Los dos últimos son utillaje para
agentes de IA, no librerías de aplicación:

| Paquete | Qué es según su propio manifiesto |
|---|---|
| `impeccable` | «Design skills, commands, and anti-pattern detection for AI coding agents» |
| `taste-skill` | «Anti-slop design skills for Hermes Agent and AI coding tools» |
| `gsap` | Librería de animación real, pero sin un solo uso en `src/` ni en `e2e/` |

`impeccable` arrastraba además `puppeteer` como dependencia opcional, y con él un Chromium
completo: `node_modules` pasó de 449 MB a 400 MB al quitarlos.

## De dónde salieron

Del entorno del editor, no del producto. En la máquina donde se detectaron había dos plugins de
Claude Code instalados **con scope de este proyecto**:

```
impeccable@impeccable      scope=project
gsap-skills@gsap-skills    scope=project
```

Encaja con lo observado: `gsap`, `impeccable` y `taste-skill` aparecieron juntos en un proyecto que
no importa ninguno.

**Esos plugins no son necesarios para nada del repositorio.** No los usa el build, ni los tests, ni
CI, ni el despliegue. Son herramientas de quien edita, viven en la configuración personal de Claude
Code —fuera del árbol del proyecto— y por tanto no se suben ni se versionan. La decisión de
mantenerlos o quitarlos es del entorno de cada persona, no del repositorio.

## Antes del primer push

El riesgo no es tener esos plugins: es que vuelvan a escribir en el manifiesto sin que nadie lo
note. Comprobar que `dependencies` no ha crecido con paquetes que nadie importa:

```bash
# Cada dependencia declarada debería aparecer en algún import del código
for dep in $(node -p "Object.keys(require('./package.json').dependencies).join(' ')"); do
    grep -rq "$dep" src e2e scripts supabase 2>/dev/null || echo "sin usar: $dep"
done
```

Un paquete sin uso es candidato a salir, no a quedarse «por si acaso».

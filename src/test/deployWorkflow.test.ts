// @vitest-environment node
import {readFileSync} from 'node:fs'
import {join} from 'node:path'
import {describe, expect, it} from 'vitest'

/**
 * Dos hechos de los workflows de los que depende el diagnóstico del pipeline.
 *
 * La versión del CLI desapareció una vez del árbol de trabajo sin que nadie lo notara, y el
 * comportamiento de reconciliación de `db push` —incluido el que obliga a `--include-all`— se
 * verificó contra una versión concreta. Sin fijarla, cada despliegue usa lo que se resuelva ese
 * día, que es exactamente el tipo de cambio silencioso que rompió este pipeline la primera vez.
 *
 * Ahora la fija `package.json` y no `supabase/setup-cli`, así que lo que hay que guardar es que
 * ningún workflow reintroduzca una segunda vía de instalación: un `setup-cli` de vuelta, o una
 * llamada al CLI que no pase por `pnpm exec`, devuelven las dos fuentes de verdad que divergieron.
 *
 * `RELEASE_CHECKLIST.md` marca como cumplido que el CLI use una versión fijada; esto lo comprueba
 * en vez de confiarlo a una casilla.
 */
const WORKFLOWS = ['deploy.yml', 'quality.yml'].map((name) => ({
    name,
    body: readFileSync(join(process.cwd(), '.github', 'workflows', name), 'utf8'),
}))

const DEPLOY = WORKFLOWS[0].body

describe('.github/workflows', () => {
    it('pins the Supabase CLI in package.json and nowhere else', () => {
        const pin = JSON.parse(readFileSync(join(process.cwd(), 'package.json'), 'utf8'))
            .devDependencies.supabase

        expect(pin).toMatch(/^\d+\.\d+\.\d+$/)

        for (const {name, body} of WORKFLOWS) {
            // Un `run:` que invoque el CLI sin `pnpm exec` usaría el binario que estuviera en PATH.
            const calls = body.match(/^\s*(?:run:\s*|(?:-\s*)?)supabase\s/gm) ?? []

            expect(`${name}: ${calls.join(', ')}`).toBe(`${name}: `)
            // El nombre aparece en los comentarios que explican por qué ya no está; lo que no
            // puede volver es el paso que lo usa.
            expect(body).not.toMatch(/uses:\s*supabase\/setup-cli/)
        }
    })

    // Sin `--include-all`, `db push` rechaza `20260000_enable_extension.sql` por estar ordenada
    // antes de la cabeza remota, no aplica nada y tumba todos los pasos siguientes.
    it('applies pending migrations with --include-all', () => {
        expect(DEPLOY).toContain('supabase db push --linked --include-all')
    })
})

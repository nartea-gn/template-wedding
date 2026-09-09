import {readFileSync} from 'node:fs'
import {join} from 'node:path'
import {describe, expect, it} from 'vitest'

/**
 * Dos hechos del workflow de despliegue de los que depende el diagnóstico del pipeline.
 *
 * El pin del CLI desapareció una vez del árbol de trabajo sin que nadie lo notara, y el
 * comportamiento de reconciliación de `db push` —incluido el que obliga a `--include-all`— se
 * verificó contra 2.111.0. Sin pin, cada despliegue usa lo que el action resuelva ese día, que es
 * exactamente el tipo de cambio silencioso que rompió este pipeline la primera vez.
 *
 * `RELEASE_CHECKLIST.md` marca como cumplido que el CLI use una versión fijada; esto lo comprueba
 * en vez de confiarlo a una casilla.
 */
const WORKFLOW = join(process.cwd(), '.github', 'workflows', 'deploy.yml')

describe('.github/workflows/deploy.yml', () => {
    const workflow = readFileSync(WORKFLOW, 'utf8')

    it('pins the Supabase CLI to an explicit version', () => {
        const step = workflow.slice(workflow.indexOf('Install Supabase CLI'))
        const pin = /uses:\s*supabase\/setup-cli@v1\s*\n\s*with:\s*\n\s*version:\s*(\d+\.\d+\.\d+)/.exec(step)

        expect(pin?.[1]).toMatch(/^\d+\.\d+\.\d+$/)
    })

    // Sin `--include-all`, `db push` rechaza `20260000_enable_extension.sql` por estar ordenada
    // antes de la cabeza remota, no aplica nada y tumba todos los pasos siguientes.
    it('applies pending migrations with --include-all', () => {
        expect(workflow).toContain('supabase db push --linked --include-all')
    })
})

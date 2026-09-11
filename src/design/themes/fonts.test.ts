// @vitest-environment node
import {readFileSync, existsSync} from 'node:fs'
import {dirname, join} from 'node:path'
import {fileURLToPath} from 'node:url'
import {describe, expect, it} from 'vitest'
import {themes} from './themes'

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '../../assets/fonts')
const css = readFileSync(join(RAIZ, 'fonts.css'), 'utf8')

/**
 * Las familias se sirven desde el propio origen, y eso quita la red de en medio: si a un tema le
 * falta la suya, no hay CDN que lo salve -- la pagina cae al tipo del sistema sin decir nada, que
 * es justo lo que el plugin retirado se encargaba de impedir. Esto lo comprueba en su lugar.
 */
describe('fuentes alojadas', () => {
    const declaradas = [...new Set(Object.values(themes).flatMap(tema => tema.googleFonts))]
        .map(entrada => entrada.split(':')[0].replaceAll('+', ' '))

    it.each(declaradas)('%s tiene sus caras declaradas', familia => {
        expect(css).toContain(`font-family: '${familia}'`)
    })

    it('no referencia ningun fichero que no esté en el repositorio', () => {
        const rutas = [...css.matchAll(/url\('\.\/([^']+)'\)/g)].map(m => m[1])
        expect(rutas.length).toBeGreaterThan(0)
        expect(rutas.filter(ruta => !existsSync(join(RAIZ, ruta)))).toEqual([])
    })

    // El aviso del articulo 13 dice "no se ceden a nadie mas", y una url a gstatic lo desmiente
    // antes del primer pintado.
    it('no pide nada a un tercero', () => {
        expect(css).not.toContain('http')
    })
})

import {mkdirSync, writeFileSync, readFileSync, rmSync} from 'node:fs'
import {createHash} from 'node:crypto'
import {join} from 'node:path'

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
const SUBCONJUNTOS = new Set(['latin', 'latin-ext', 'cyrillic', 'cyrillic-ext'])

const familias = [...readFileSync('src/design/themes/themes.ts', 'utf8')
    .matchAll(/googleFonts: \[([^\]]+)\]/g)]
    .flatMap(m => [...m[1].matchAll(/'([^']+)'/g)].map(f => f[1]))
const unicas = [...new Set(familias)]

const destino = 'src/assets/fonts'
rmSync(destino, {recursive: true, force: true})
mkdirSync(destino, {recursive: true})
// Varias familias son variables: Google devuelve el mismo woff2 para los tres pesos, asi que sin
// esto el repositorio guardaba el mismo fichero tres veces.
const porContenido = new Map()
const reglas = []
let total = 0, ficheros = 0

for (const familia of unicas) {
    const css = await (await fetch(`https://fonts.googleapis.com/css2?family=${familia}&display=swap`, {headers: {'User-Agent': UA}})).text()
    const bloques = css.split('/*').slice(1)
    for (const bloque of bloques) {
        const subconjunto = bloque.slice(0, bloque.indexOf('*/')).trim()
        if (!SUBCONJUNTOS.has(subconjunto)) continue
        const nombre = /font-family: '([^']+)'/.exec(bloque)?.[1]
        const estilo = /font-style: (\w+)/.exec(bloque)?.[1]
        const peso = /font-weight: (\d+)/.exec(bloque)?.[1]
        const url = /src: url\(([^)]+)\)/.exec(bloque)?.[1]
        const rango = /unicode-range: ([^;]+);/.exec(bloque)?.[1]
        if (!url) continue
        const carpeta = nombre.toLowerCase().replaceAll(' ', '-')
        mkdirSync(join(destino, carpeta), {recursive: true})
        const bytes = Buffer.from(await (await fetch(url, {headers: {'User-Agent': UA}})).arrayBuffer())
        const huella = createHash('sha256').update(bytes).digest('hex').slice(0, 8)
        let fichero = porContenido.get(huella)
        if (!fichero) {
            fichero = `${carpeta}-${peso}-${estilo}-${subconjunto}.woff2`
            writeFileSync(join(destino, carpeta, fichero), bytes)
            porContenido.set(huella, fichero)
            total += bytes.length
            ficheros++
        }
        reglas.push(`@font-face {
    font-family: '${nombre}';
    font-style: ${estilo};
    font-weight: ${peso};
    font-display: swap;
    src: url('./${carpeta}/${fichero}') format('woff2');
    unicode-range: ${rango};
}`)
    }
}
writeFileSync(join(destino, 'fonts.css'), `/*
 * LAS FUENTES SE SIRVEN DESDE AQUI, NO DESDE GOOGLE
 *
 * Medido en la landing: pedirlas al CDN eran dos peticiones a terceros -- la hoja de estilo de
 * fonts.googleapis.com y el woff2 de fonts.gstatic.com -- antes del primer pintado, y con ellas
 * viajaban la IP y el User-Agent de cada invitado. El aviso del articulo 13 que firma el
 * formulario dice "no se ceden a nadie mas", asi que era el propio producto contradiciendose.
 *
 * Solo los subconjuntos que el producto escribe: latin y latin-ext para es/en, cirilico para bg.
 * El navegador descarga unicamente las familias del tema activo, y dentro de ellas solo los
 * rangos que la pagina usa.
 *
 * Generado con scripts/vendor-fonts.mjs a partir de \`googleFonts\` de cada tema. Las siete
 * familias son OFL: alojarlas esta permitido.
 */

${reglas.join('\n\n')}
`)
console.log(`familias ${unicas.length} · ficheros ${ficheros} · ${(total / 1024).toFixed(0)} KiB`)

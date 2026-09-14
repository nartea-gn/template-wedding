import {expect, test, type Page} from '@playwright/test'
import {themes, toCssVariables, type ThemeId} from '../src/design/themes'
import {ADMIN_RESPONSE_ROWS, signInToAdminPanel} from './fixtures/admin-panel'

// 320 px included on purpose: `PRODUCT_BACKLOG.md` requires "320, 390, 768 y 1440 px con todos
// los temas", and this matrix started at 390. The narrowest breakpoint is where the countdown
// once squeezed its labels to 7,68 px, and it was only ever checked by hand -- and only for the
// five themes that existed then.
const viewports = [
    {name: 'móvil pequeño', width: 320, height: 568},
    {name: 'móvil', width: 390, height: 844},
    {name: 'tablet', width: 768, height: 1024},
    {name: 'escritorio', width: 1440, height: 900},
]

const themeIds = Object.keys(themes) as ThemeId[]

test.beforeEach(async ({page}) => {
    await page.clock.setFixedTime(new Date('2026-08-03T12:00:00+02:00'))
    await page.emulateMedia({reducedMotion: 'reduce'})
})

for (const themeId of themeIds) {
    for (const viewport of viewports) {
        test(`${themeId} mantiene Landing, RSVP y Admin en ${viewport.name}`, async ({page}) => {
            await page.setViewportSize({width: viewport.width, height: viewport.height})
            await page.goto('./')
            await applyTheme(page, themeId)

            await expect(page.locator('html')).toHaveAttribute('data-theme', themeId)
            await expect(page.getByRole('heading', {name: /Gala.*Valentin/})).toBeVisible()
            await assertCountdownAlignment(page)
            expect(await hasHorizontalOverflow(page)).toBe(false)
            expect(await page.locator('.landing-page').evaluate(element =>
                getComputedStyle(element, '::before').backgroundImage,
            )).not.toBe('none')

            await page.goto('./rsvp')
            await applyTheme(page, themeId)

            await expect(page.getByRole('heading', {name: 'Asistencia'})).toBeVisible()
            await expect(page.getByLabel('Nombre y apellidos')).toBeVisible()
            expect(await hasHorizontalOverflow(page)).toBe(false)
            expect(await page.locator('.rsvp-page').evaluate(element =>
                getComputedStyle(element, '::before').backgroundImage,
            )).not.toBe('none')

            await page.goto('./admin')
            await applyTheme(page, themeId)

            await expect(page.getByRole('heading', {name: 'Respuestas RSVP'})).toBeVisible()
            await expect(page.getByLabel('Correo electrónico')).toBeVisible()
            await expect(page.getByLabel('Contraseña', {exact: true})).toBeVisible()
            await expect(page.getByRole('button', {name: 'Entrar al panel'})).toBeVisible()
            expect(await hasHorizontalOverflow(page)).toBe(false)
            expect(await page.locator('.login-page').evaluate(element =>
                getComputedStyle(element, '::before').backgroundImage,
            )).not.toBe('none')
        })
    }
}

// CONFIRMADO Y CIERRE TAMBIEN LLEVAN LA OBRA DEL TEMA
//
// `patterns.css` seguia nombrando `.rsvp-success-page`, la clase que el reparto en
// `.rsvp-confirmed-page` y `.rsvp-closed-page` dejo sin usar: las dos pantallas se quedaban con el
// color de fondo plano y sin `::before`, y la matriz de arriba no lo veia porque solo mira
// `.rsvp-page`, `.landing-page` y `.login-page`.
//
// Un solo viewport por tema, y no la matriz de cuatro: lo que aqui se comprueba es que el selector
// case, que no depende del ancho. Las URLs por breakpoint de `--theme-background-art` ya las cubre
// la matriz sobre `.rsvp-page`.
for (const themeId of themeIds) {
    test(`${themeId} viste las pantallas de confirmado y de cierre`, async ({page}) => {
        await page.setViewportSize({width: 1440, height: 900})
        await page.route('**/rest/v1/rsvp_responses*', route => route.fulfill({
            status: 201,
            contentType: 'application/json',
            body: '[]',
        }))

        await page.goto('./rsvp')
        await applyTheme(page, themeId)

        // El camino que declina es el mas corto de los dos y pasa por el mismo estado de exito.
        await page.getByLabel('Nombre y apellidos').fill('Invitada de Prueba')
        await page.getByLabel('No podré asistir').check()
        await page.getByRole('button', {name: 'Siguiente'}).click()
        await page.getByLabel('Tu mensaje').fill('Os deseo lo mejor')
        await page.getByRole('button', {name: 'Enviar confirmación'}).click()

        // El titulo primero: `evaluate` no reintenta, asi que la espera automatica de Playwright es
        // la que garantiza que se mide la pantalla ya pintada y no la anterior.
        await expect(page.getByRole('heading', {name: '¡Muchas gracias!'})).toBeVisible()
        expect(await hasHorizontalOverflow(page)).toBe(false)
        // El ornamento es `width: 100%` con `max-width: 24rem` y sin margen horizontal: en la
        // landing lo centra el flex del hero, y en esta tarjeta -- que no es flex -- quedaba 55 px
        // a la izquierda. Se mide el centro en vez de comprobar la propiedad, que es lo unico que
        // distingue el centrado real de una regla presente que no lo consigue.
        expect(await ornamentCenterOffset(page)).toBeLessThanOrEqual(0.5)
        expect(await page.locator('.rsvp-confirmed-page').evaluate(element =>
            getComputedStyle(element, '::before').backgroundImage,
        )).not.toBe('none')

        // Pasado el plazo compilado en la invitacion, `deadlinePassed` cierra el formulario antes de
        // consultar el estado en vivo, asi que no hace falta fingir la base de datos.
        await page.clock.setFixedTime(new Date('2027-05-13T00:00:00+02:00'))
        await page.goto('./rsvp')
        await applyTheme(page, themeId)

        await expect(page.getByRole('heading', {name: 'El plazo ha finalizado'})).toBeVisible()
        expect(await hasHorizontalOverflow(page)).toBe(false)
        expect(await page.locator('.rsvp-closed-page').evaluate(element =>
            getComputedStyle(element, '::before').backgroundImage,
        )).not.toBe('none')
    })
}

// EL PANEL AUTENTICADO, QUE NO TENIA COBERTURA NINGUNA
//
// La matriz de arriba llega a `./admin` y se queda en la pantalla de acceso: entrar exige una
// sesion de gotrue. Todo lo que hay detras -- la cabecera, las tarjetas, la tabla y sus acciones
// -- se comprobaba a mano, y ahi vivian dos fallos que ninguna asercion vio: el conjunto del boton
// de refrescar 13 px a la izquierda de su centro, y `.admin-actions` sin `flex-wrap` desbordando
// el documento a 320 px.
//
// Dos anchos por tema y no la matriz de cuatro: 320 px es donde el desbordamiento aparecia, y
// 1440 el ancho donde se midio el descentrado. Los intermedios no anaden un modo de fallo nuevo,
// y cada test paga un acceso.
const ADMIN_VIEWPORTS = [
    {name: 'móvil pequeño', width: 320, height: 900},
    {name: 'escritorio', width: 1440, height: 1200},
]

for (const themeId of themeIds) {
    test(`${themeId} mantiene el panel legible y sin desbordes`, async ({page}) => {
        await page.setViewportSize(ADMIN_VIEWPORTS[1])
        await signInToAdminPanel(page)
        await applyTheme(page, themeId)

        // Las acciones de fila son solo icono desde que el texto competia con el dato. Se busca por
        // nombre accesible a proposito: es lo que oye un lector de pantalla, y es lo unico que
        // queda cuando el `aria-label` desaparece por descuido.
        const editButtons = page.getByRole('button', {name: 'Editar'})
        const deleteButtons = page.getByRole('button', {name: 'Eliminar'})
        await expect(editButtons).toHaveCount(ADMIN_RESPONSE_ROWS.length)
        await expect(deleteButtons).toHaveCount(ADMIN_RESPONSE_ROWS.length)

        // Y que sea icono, no texto: el nombre accesible sale igual de un `aria-label` que de la
        // palabra escrita dentro del boton, asi que contarlos no distingue una version de la otra.
        for (const button of [editButtons, deleteButtons]) {
            expect(await button.first().locator('svg').count()).toBe(1)
            expect((await button.first().innerText()).trim()).toBe('')
        }

        // El panel lleva la obra del tema solo en la cabecera, y la mascara la apaga antes de la
        // tabla. Se comprueba lo uno y lo otro: que el guino exista, y que no llegue al dato.
        const art = await page.locator('.admin-page').evaluate(element => {
            const style = getComputedStyle(element, '::before')
            const table = document.querySelector('.responses-table')!.getBoundingClientRect()
            return {
                image: style.backgroundImage,
                height: Number.parseFloat(style.height),
                tableTop: table.top + window.scrollY,
            }
        })
        expect(art.image).not.toBe('none')
        // Holgura entre el final del adorno y el inicio de la tabla. Sin margen, un cambio de
        // altura del `clamp` metería la ilustración bajo las filas sin que nada se quejara.
        expect(art.tableTop - art.height).toBeGreaterThan(120)

        const desktop = await measureAdminPanel(page)
        expect(desktop.refreshOffset).toBeLessThanOrEqual(0.5)
        expect(desktop.overflow).toBe(false)
        // 44 px de lado es el minimo de WCAG 2.5.5 para un objetivo tactil.
        expect(desktop.actionSize.width).toBeGreaterThanOrEqual(44)
        expect(desktop.actionSize.height).toBeGreaterThanOrEqual(44)
        // El panel subio un escalon entero de escala. Se fija el suelo, no el valor exacto: crecer
        // mas adelante no deberia romper este test, y volver a los 12 px si.
        expect(desktop.fontSizes.statLabel).toBeGreaterThanOrEqual(14)
        expect(desktop.fontSizes.tableHead).toBeGreaterThanOrEqual(14)
        expect(desktop.fontSizes.tableCell).toBeGreaterThanOrEqual(16)

        await page.setViewportSize(ADMIN_VIEWPORTS[0])
        const narrow = await measureAdminPanel(page)
        expect(narrow.overflow).toBe(false)
        expect(narrow.refreshOffset).toBeLessThanOrEqual(0.5)
    })
}

type AdminMeasurements = {
    refreshOffset: number
    overflow: boolean
    actionSize: {width: number, height: number}
    fontSizes: {statLabel: number, tableHead: number, tableCell: number}
}

/**
 * Mide de una vez lo que el panel puede romper: centrado, desbordes, tamaño táctil y escala.
 *
 * Todo dentro de un solo `evaluate`, como el medidor de la cuenta atrás: dos viajes leerían dos
 * layouts distintos si algo se mueve entre ellos, y aquí lo que se compara son centros.
 */
async function measureAdminPanel(page: Page): Promise<AdminMeasurements> {
    return page.evaluate(async () => {
        // Dos frames antes de medir. Cambiar el viewport no reordena el layout de inmediato, y sin
        // esta espera el ancho leido era el del viewport anterior: el mismo motivo por el que la
        // cuenta atras mide dentro de un solo `evaluate` y despues de `document.fonts.ready`.
        await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())))

        const refresh = document.querySelector<HTMLElement>('.admin-btn-refresh')
        const icon = refresh?.querySelector('svg')
        const action = document.querySelector<HTMLElement>('.responses-action')
        const size = (selector: string) => {
            const element = document.querySelector(selector)
            return element ? Number.parseFloat(getComputedStyle(element).fontSize) : 0
        }

        // El desvio se mide sobre el bloque que forman icono y texto juntos, no sobre el texto: el
        // texto ya estaba centrado -- eso es justo lo que `.btn--iconic` conseguia -- y el icono era
        // el que colgaba fuera. El nodo de texto se mide con un `Range`, porque no tiene elemento
        // propio del que pedir un rectangulo.
        let refreshOffset = 0
        if (refresh && icon) {
            const button = refresh.getBoundingClientRect()
            const iconBox = icon.getBoundingClientRect()
            const textNode = [...refresh.childNodes]
                .find(node => node.nodeType === Node.TEXT_NODE && node.textContent?.trim())
            let contentLeft = iconBox.x
            let contentRight = iconBox.right
            if (textNode) {
                const range = document.createRange()
                range.selectNodeContents(textNode)
                const textBox = range.getBoundingClientRect()
                contentLeft = Math.min(contentLeft, textBox.x)
                contentRight = Math.max(contentRight, textBox.right)
            }
            refreshOffset = Math.abs((contentLeft + contentRight) / 2 - (button.x + button.width / 2))
        }

        return {
            refreshOffset,
            overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
            actionSize: action
                ? {width: action.getBoundingClientRect().width, height: action.getBoundingClientRect().height}
                : {width: 0, height: 0},
            fontSizes: {
                statLabel: size('.stat-label'),
                tableHead: size('.responses-th'),
                tableCell: size('.responses-td'),
            },
        }
    })
}

// LA PANTALLA DE CARGA TAMBIEN LLEVA LA OBRA
//
// `.route-loading` es el fallback de Suspense de `/rsvp` y `/admin`, y se quedaba con el color
// plano mientras la pantalla que llega detras si trae la ilustracion: entrar era un salto de
// fondo. Medido antes del arreglo, `::before` daba `none` con `data-theme="royal"` ya puesto.
//
// Un tema y un ancho: lo que se comprueba es que el selector alcance a esta clase. Las URLs por
// tema y por breakpoint las cubre la matriz de arriba, y cada caso aqui paga una espera.
test('la pantalla de carga de ruta lleva el fondo del tema', async ({page}) => {
    await page.setViewportSize({width: 1440, height: 900})

    // Se retiene el modulo de la ruta para sostener el fallback. El patron cubre tanto el fichero
    // del dev server (`/src/pages/Rsvp.tsx`) como el chunk con hash de un build.
    await page.route('**/Rsvp*', async route => {
        await new Promise(resolve => setTimeout(resolve, 2000))
        await route.continue()
    })
    // `waitUntil: 'commit'` para no esperar la carga completa, que es justo lo que se retiene.
    await page.goto('./rsvp', {waitUntil: 'commit'})

    const loading = page.locator('.route-loading')
    await expect(loading).toBeVisible()
    // El atributo primero: la regla entera cuelga de `[data-theme]`, asi que sin el la asercion
    // del fondo fallaria por un motivo que no es el que se quiere vigilar.
    await expect(page.locator('html')).toHaveAttribute('data-theme', /.+/)
    // El arte se guarda mientras la pantalla de carga existe: despues ya no hay de donde leerlo.
    const loadingArt = await loading.evaluate(element =>
        getComputedStyle(element, '::before').backgroundImage)
    expect(loadingArt).not.toBe('none')

    // Y que la pantalla que llega detras traiga el mismo: la continuidad es lo que se busca, no
    // que cada pantalla tenga un fondo cualquiera.
    await expect(page.getByRole('heading', {name: 'Asistencia'})).toBeVisible()
    const pageArt = await page.locator('.rsvp-page').evaluate(element =>
        getComputedStyle(element, '::before').backgroundImage)
    expect(loadingArt).toBe(pageArt)
})

async function applyTheme(page: Page, themeId: ThemeId) {
    const variables = toCssVariables(themes[themeId])
    await page.evaluate(({id, cssVariables}) => {
        document.documentElement.dataset.theme = id
        for (const [name, value] of Object.entries(cssVariables)) {
            document.documentElement.style.setProperty(name, value)
        }
    }, {id: themeId, cssVariables: variables})
}

/** Cuanto se desvia el centro del ornamento del centro de su tarjeta, en px. */
async function ornamentCenterOffset(page: Page) {
    return page.evaluate(() => {
        const card = document.querySelector('.rsvp-confirmed-card')
        const ornament = document.querySelector('.landing-ornament')
        if (!card || !ornament) return 0
        const centerOf = (element: Element) => {
            const box = element.getBoundingClientRect()
            return box.x + box.width / 2
        }
        return Math.abs(centerOf(ornament) - centerOf(card))
    })
}

async function hasHorizontalOverflow(page: Page) {
    return page.evaluate(() =>
        document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    )
}

// Digits and separators are measured inside a single evaluate on purpose. Splitting them into two
// round-trips reads two different layouts: anything that shifts the page in between -- an image
// above the countdown finishing its decode, which is exactly what happens when the machine is
// loaded -- moves the separators relative to digits that were measured before the shift. That
// reported a 12 px misalignment on a page whose screenshot was perfectly aligned.
async function assertCountdownAlignment(page: Page) {
    const worstOffset = await page.evaluate(async () => {
        const value = document.querySelector<HTMLElement>('.landing-countdown-value')
        if (!value) return 0

        const style = getComputedStyle(value)
        await document.fonts.load(`${style.fontWeight} ${style.fontSize} ${style.fontFamily}`)
        await document.fonts.ready
        await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())))

        const centerOf = (element: Element) => {
            const box = element.getBoundingClientRect()
            return box.y + box.height / 2
        }
        const valueCenters = [...document.querySelectorAll('.landing-countdown-value')].map(centerOf)
        const separatorCenters = [...document.querySelectorAll('.landing-countdown-sep')].map(centerOf)
        if (!valueCenters.length || !separatorCenters.length) return 0

        const valueCenter = valueCenters.reduce((total, center) => total + center, 0) / valueCenters.length
        return Math.max(...separatorCenters.map(center => Math.abs(center - valueCenter)))
    })

    expect(worstOffset).toBeLessThanOrEqual(0.5)
}

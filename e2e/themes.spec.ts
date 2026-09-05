import {expect, test, type Page} from '@playwright/test'
import {themes, toCssVariables, type ThemeId} from '../src/design/themes'

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
            await expect(page.getByLabel('Nombre y apellidos *')).toBeVisible()
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

async function applyTheme(page: Page, themeId: ThemeId) {
    const variables = toCssVariables(themes[themeId])
    await page.evaluate(({id, cssVariables}) => {
        document.documentElement.dataset.theme = id
        for (const [name, value] of Object.entries(cssVariables)) {
            document.documentElement.style.setProperty(name, value)
        }
    }, {id: themeId, cssVariables: variables})
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

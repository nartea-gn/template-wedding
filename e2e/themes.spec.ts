import {expect, test, type Page} from '@playwright/test'
import {themes, toCssVariables, type ThemeId} from '../src/design/themes'

const viewports = [
    {name: 'móvil', width: 390, height: 844},
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
            await page.goto('./#/')
            await applyTheme(page, themeId)

            await expect(page.locator('html')).toHaveAttribute('data-theme', themeId)
            await expect(page.getByRole('heading', {name: /Gala.*Valentin/})).toBeVisible()
            expect(await hasHorizontalOverflow(page)).toBe(false)
            expect(await page.locator('.landing-page').evaluate(element =>
                getComputedStyle(element, '::before').backgroundImage,
            )).not.toBe('none')

            await page.goto('./#/rsvp')
            await applyTheme(page, themeId)

            await expect(page.getByRole('heading', {name: 'Asistencia'})).toBeVisible()
            await expect(page.getByLabel('Nombre y apellidos *')).toBeVisible()
            expect(await hasHorizontalOverflow(page)).toBe(false)
            expect(await page.locator('.rsvp-page').evaluate(element =>
                getComputedStyle(element, '::before').backgroundImage,
            )).not.toBe('none')

            await page.goto('./#/admin')
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

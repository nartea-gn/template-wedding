import {expect, test, type Page} from '@playwright/test'

const viewports = [
    {name: '320', width: 320, height: 568},
    {name: '390', width: 390, height: 844},
    {name: '768', width: 768, height: 1024},
    {name: '1440', width: 1440, height: 900},
]

test.beforeEach(async ({page}) => {
    await page.clock.setFixedTime(new Date('2026-08-03T12:00:00+02:00'))
})

for (const viewport of viewports) {
    test(`Landing y RSVP no desbordan a ${viewport.name} px`, async ({page}) => {
        await page.setViewportSize({width: viewport.width, height: viewport.height})
        await page.goto('./#/')

        await expect(page.getByRole('heading', {name: /Gala.*Valentin/})).toBeVisible()
        await expect(page.getByText('Falta para el gran día')).toBeVisible()
        expect(await hasHorizontalOverflow(page)).toBe(false)

        await page.goto('./#/rsvp')

        await expect(page.getByRole('heading', {name: 'Asistencia'})).toBeVisible()
        await expect(page.getByLabel('Nombre y apellidos *')).toBeVisible()
        expect(await hasHorizontalOverflow(page)).toBe(false)
    })
}

async function hasHorizontalOverflow(page: Page) {
    return page.evaluate(() =>
        document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    )
}

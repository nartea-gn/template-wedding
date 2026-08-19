import {expect, test, type Page} from '@playwright/test'
import {longContentByLocale, type LongContentLocale} from './fixtures/long-content'

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

for (const locale of Object.keys(longContentByLocale) as LongContentLocale[]) {
    test(`Landing y RSVP admiten contenido largo en ${locale.toUpperCase()} a 320 px`, async ({page}) => {
        await page.setViewportSize({width: 320, height: 568})
        await page.emulateMedia({reducedMotion: 'reduce'})
        await page.goto('./#/')
        await selectLocale(page, locale)
        await injectLongLandingContent(page, locale)

        await expect(page.locator('.landing-title')).toContainText(longContentByLocale[locale].title)
        await expect(page.locator('.landing-cta-btn')).toContainText(longContentByLocale[locale].cta)
        expect(await hasHorizontalOverflow(page)).toBe(false)

        await page.goto('./#/rsvp')
        await selectLocale(page, locale)
        await injectLongRsvpContent(page, locale)

        await expect(page.locator('.rsvp-section-title')).toContainText(longContentByLocale[locale].rsvpTitle)
        await expect(page.locator('.rsvp-option-label').first()).toContainText(longContentByLocale[locale].rsvpOption)
        expect(await hasHorizontalOverflow(page)).toBe(false)
    })
}

test('Landing y RSVP conservan reflow y acciones utilizables con zoom al 200 %', async ({page}) => {
    await page.setViewportSize({width: 640, height: 900})
    await page.emulateMedia({reducedMotion: 'reduce'})
    await page.goto('./#/')
    await applyTwoHundredPercentZoom(page)

    await expect(page.getByRole('heading', {name: /Gala.*Valentin/})).toBeVisible()
    await expect(page.getByRole('link', {name: 'Confirmar asistencia'})).toBeVisible()
    expect(await hasHorizontalOverflow(page)).toBe(false)

    await page.goto('./#/rsvp')
    await applyTwoHundredPercentZoom(page)

    await expect(page.getByRole('heading', {name: 'Asistencia'})).toBeVisible()
    await expect(page.getByLabel('Nombre y apellidos *')).toBeVisible()
    await expect(page.getByRole('button', {name: 'Confirmar todo'})).toBeVisible()
    expect(await hasHorizontalOverflow(page)).toBe(false)
})

test('Landing, RSVP y acceso Admin mantienen un orden de foco visible por teclado', async ({page}) => {
    await page.setViewportSize({width: 390, height: 844})
    await page.emulateMedia({reducedMotion: 'reduce'})

    for (const route of ['./#/', './#/rsvp', './#/admin']) {
        await page.goto(route)
        await page.locator('.landing-page, .rsvp-page, .login-page').waitFor({state: 'visible'})
        await assertVisibleKeyboardSequence(page)
    }
})

async function hasHorizontalOverflow(page: Page) {
    return page.evaluate(() =>
        document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    )
}

async function selectLocale(page: Page, locale: LongContentLocale) {
    if (await page.locator('html').getAttribute('lang') === locale) return

    const trigger = page.locator('.language-selector-trigger')
    await expect(trigger).toBeVisible()
    await trigger.click()
    const labels = {
        es: /ES.*Español/,
        en: /EN.*English/,
        bg: /BG.*Български/,
    } as const
    await page.getByRole('menuitemradio', {name: labels[locale]}).click()
}

async function injectLongLandingContent(page: Page, locale: LongContentLocale) {
    const content = longContentByLocale[locale]
    await expect(page.locator('.landing-title')).toBeVisible()
    await page.locator('.landing-title').evaluate((element, value) => element.textContent = value, content.title)
    await page.locator('.landing-subtitle').evaluate((element, value) => element.textContent = value, content.subtitle)
    await page.locator('.landing-venue-name').evaluateAll((elements, value) => {
        for (const element of elements) element.textContent = value
    }, content.venue)
    await page.locator('.landing-venue-address').evaluateAll((elements, value) => {
        for (const element of elements) element.textContent = value
    }, content.address)
    await page.locator('.landing-cta-btn').evaluate((element, value) => element.textContent = value, content.cta)
}

async function injectLongRsvpContent(page: Page, locale: LongContentLocale) {
    const content = longContentByLocale[locale]
    await expect(page.locator('.rsvp-section-title')).toBeVisible()
    await page.locator('.rsvp-section-title').evaluate((element, value) => element.textContent = value, content.rsvpTitle)
    await page.locator('.rsvp-field .label').first().evaluate((element, value) => {
        element.textContent = value
    }, content.rsvpLabel)
    await page.locator('.rsvp-option-label').first().evaluate((element, value) => {
        element.textContent = value
    }, content.rsvpOption)
}

async function applyTwoHundredPercentZoom(page: Page) {
    await page.evaluate(() => {
        document.documentElement.style.zoom = '2'
    })
}

async function assertVisibleKeyboardSequence(page: Page) {
    await page.evaluate(() => {
        if (document.activeElement instanceof HTMLElement) document.activeElement.blur()
    })

    let visitedElements = 0
    let reachedSequenceEnd = false

    for (let index = 0; index < 30; index += 1) {
        await page.keyboard.press('Tab')
        const focusedElement = await page.evaluate(() => {
            const element = document.activeElement
            if (!(element instanceof HTMLElement)) return null
            const bounds = element.getBoundingClientRect()
            const style = getComputedStyle(element)
            return {
                tag: element.tagName,
                visible: bounds.width > 0 && bounds.height > 0,
                focusVisible: element.matches(':focus-visible'),
                outline: style.outlineStyle,
                boxShadow: style.boxShadow,
            }
        })

        expect(focusedElement).not.toBeNull()
        if (focusedElement?.tag === 'BODY') {
            reachedSequenceEnd = true
            break
        }

        expect(focusedElement?.visible).toBe(true)
        expect(focusedElement?.focusVisible).toBe(true)
        expect(
            focusedElement?.outline !== 'none' || focusedElement?.boxShadow !== 'none',
        ).toBe(true)
        visitedElements += 1
    }

    expect(visitedElements).toBeGreaterThan(0)
    expect(reachedSequenceEnd).toBe(true)
}

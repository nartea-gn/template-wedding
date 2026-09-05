import {expect, test, type Page} from '@playwright/test'

/**
 * Exercises the Content-Security-Policy the build emits, against the build itself.
 *
 * `pnpm smoke:test` already checks that the policy exists and names Supabase, but it reads HTML
 * over `fetch`: it cannot know whether the policy blocks something the app needs. Nothing else
 * can either -- the plugin that emits the policy is `apply: 'build'`, so the dev server the rest
 * of the suite runs against never carries one. This spec runs a browser against `vite preview`.
 */

type Violation = {directive: string; blockedUri: string}

declare global {
    interface Window {
        __cspViolations: Violation[]
    }
}

test.beforeEach(async ({page}) => {
    await page.clock.setFixedTime(new Date('2026-08-03T12:00:00+02:00'))
    await page.addInitScript(() => {
        window.__cspViolations = []
        document.addEventListener('securitypolicyviolation', event => {
            window.__cspViolations.push({
                directive: event.violatedDirective,
                blockedUri: event.blockedURI,
            })
        })
    })
})

async function violationsAfterVisiting(page: Page, route: string): Promise<Violation[]> {
    const response = await page.goto(route, {waitUntil: 'domcontentloaded'})
    // The policy has to be present for this spec to mean anything. Without this assertion a page
    // that emits no policy at all -- the dev server, a build whose `_headers` never shipped --
    // would report zero violations and pass while protecting nothing. Deleting this line is how
    // the suite goes quietly blind; if it fails, fix the policy, never the assertion.
    expect(response?.headers()['content-security-policy'], 'the response carries no Content-Security-Policy header').toBeTruthy()
    await page.waitForTimeout(1_000)
    return page.evaluate(() => window.__cspViolations)
}

test('Landing renders under the policy without blocking anything', async ({page}) => {
    expect(await violationsAfterVisiting(page, './')).toEqual([])
})

// The interactive surfaces are visited too: they are the ones that write inline styles and open
// overlays, so a policy that only survives first paint would still break the invitation in use.
test('the language and map overlays open under the policy', async ({page}) => {
    await violationsAfterVisiting(page, './')

    await page.getByRole('button', {name: 'Idioma: Español'}).click()
    await expect(page.getByRole('menuitemradio', {name: /EN.*English/})).toBeVisible()
    await page.keyboard.press('Escape')

    await page.getByRole('button', {name: 'Cómo llegar'}).first().click()
    await expect(page.getByRole('link', {name: 'Google Maps'}).first()).toBeVisible()

    expect(await page.evaluate(() => window.__cspViolations)).toEqual([])
})

test('RSVP renders and accepts input under the policy', async ({page}) => {
    await violationsAfterVisiting(page, './rsvp')
    await page.getByLabel('Nombre y apellidos *').fill('Invitada de prueba')
    expect(await page.evaluate(() => window.__cspViolations)).toEqual([])
})

test('Admin login renders under the policy', async ({page}) => {
    expect(await violationsAfterVisiting(page, './admin')).toEqual([])
})

// The directive this whole file exists for. `frame-ancestors` is the one thing a `<meta>` policy
// could never deliver, so it is also the one thing no earlier test could cover: an invitation that
// publishes an IBAN is worth wrapping in someone else's page.
test('refuses to be embedded in a frame', async ({page, baseURL}) => {
    const blocked: string[] = []
    // Two independent signals, because either alone is brittle: Chromium words the console error
    // as "Framing ... violates", not the "Refused to display" other engines use, and a message
    // match would break on a wording change that leaves the protection intact.
    page.on('requestfailed', request => {
        if (request.failure()?.errorText.includes('ERR_BLOCKED_BY_RESPONSE')) blocked.push('request')
    })
    page.on('console', message => {
        if (message.text().includes("frame-ancestors")) blocked.push('console')
    })

    await page.setContent(`<iframe src="${baseURL}" width="400" height="300"></iframe>`)
    await page.waitForTimeout(1_500)

    const child = page.frames().find(frame => frame !== page.mainFrame())
    const renderedApp = await child?.evaluate(() => document.querySelector('.landing-page') !== null)
        .catch(() => false)

    expect(renderedApp, 'the invitation rendered inside a frame').toBe(false)
    expect(blocked, 'the browser reported no frame-ancestors refusal').not.toEqual([])
})

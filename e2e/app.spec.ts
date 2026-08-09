import {expect, test} from '@playwright/test'

test.beforeEach(async ({page}) => {
    await page.clock.setFixedTime(new Date('2026-08-03T12:00:00+02:00'))
})

test('Landing presenta la invitación y permite llegar al RSVP', async ({page}) => {
    await page.goto('./#/')

    await expect(page.getByRole('heading', {name: /Gala.*Valentin/})).toBeVisible()
    await expect(page.getByText('Falta para el gran día')).toBeVisible()

    await page.getByRole('link', {name: 'Confirmar asistencia'}).click()

    await expect(page).toHaveURL(/#\/rsvp$/)
    await expect(page.getByRole('heading', {name: 'Asistencia'})).toBeVisible()
})

test('El selector móvil mantiene visibles las tres opciones de mapas', async ({page}) => {
    await page.setViewportSize({width: 360, height: 740})
    await page.emulateMedia({reducedMotion: 'reduce'})
    await page.goto('./#/')

    const ceremony = page.locator('.landing-venue-card').filter({hasText: 'Ceremonia'})
    await ceremony.getByRole('button', {name: 'Cómo llegar'}).click()

    const dialog = page.getByRole('dialog', {name: '¿Cómo quieres llegar?'})
    await expect(dialog.getByRole('link', {name: /Abrir automáticamente/})).toBeVisible()
    await expect(dialog.getByRole('link', {name: 'Google Maps'})).toBeVisible()
    await expect(dialog.getByRole('link', {name: 'Apple Maps'})).toBeVisible()

    const optionsFitViewport = await dialog.locator('.landing-map-picker-option').evaluateAll(options =>
        options.every(option => {
            const bounds = option.getBoundingClientRect()
            return bounds.top >= 0 && bounds.bottom <= window.innerHeight
        }),
    )
    expect(optionsFitViewport).toBe(true)
})

test('Los selectores gestionan foco, teclado y Escape', async ({page}) => {
    await page.setViewportSize({width: 360, height: 740})
    await page.emulateMedia({reducedMotion: 'reduce'})
    await page.goto('./#/')

    const languageTrigger = page.getByRole('button', {name: 'Idioma: Español'})
    await languageTrigger.click()
    const spanishOption = page.getByRole('menuitemradio', {name: /ES.*Español/})
    await expect(spanishOption).toBeFocused()

    await page.keyboard.press('ArrowDown')
    await expect(page.getByRole('menuitemradio', {name: /EN.*English/})).toBeFocused()
    await page.keyboard.press('Escape')
    await expect(languageTrigger).toBeFocused()

    const ceremony = page.locator('.landing-venue-card').filter({hasText: 'Ceremonia'})
    const mapTrigger = ceremony.getByRole('button', {name: 'Cómo llegar'})
    await mapTrigger.click()
    await expect(page.getByRole('link', {name: /Abrir automáticamente/})).toBeFocused()

    await page.keyboard.press('Escape')
    await expect(mapTrigger).toBeFocused()
})

test('ES, EN y BG actualizan contenido, idioma y metadatos sin overflow', async ({page}) => {
    await page.setViewportSize({width: 360, height: 740})
    await page.emulateMedia({reducedMotion: 'reduce'})
    await page.goto('./#/')

    await expect(page.locator('html')).toHaveAttribute('lang', 'es')
    await expect(page).toHaveTitle('Invitación de boda de Gala y Valentin')

    await page.getByRole('button', {name: 'Idioma: Español'}).click()
    await page.getByRole('menuitemradio', {name: /EN.*English/}).click()
    await expect(page.locator('html')).toHaveAttribute('lang', 'en')
    await expect(page).toHaveTitle('Gala and Valentin’s wedding invitation')
    await expect(page.locator('meta[name="description"]')).toHaveAttribute(
        'content',
        'Join us to celebrate our special day.',
    )
    await expect(page.getByText('Until the big day')).toBeVisible()

    await page.getByRole('button', {name: 'Language: English'}).click()
    await page.getByRole('menuitemradio', {name: /BG.*Български/}).click()
    await expect(page.locator('html')).toHaveAttribute('lang', 'bg')
    await expect(page).toHaveTitle('Сватбена покана на Гала и Валентин')
    await expect(page.getByText('До големия ден остават')).toBeVisible()

    const hasOverflow = await page.evaluate(() =>
        document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    )
    expect(hasOverflow).toBe(false)
})

test('El deadline cierra CTA y ruta RSVP sin ocultar Admin', async ({page}) => {
    await page.clock.setFixedTime(new Date('2027-05-13T00:00:00+02:00'))
    await page.goto('./')

    await expect(page.getByRole('button', {name: 'Confirmación cerrada'})).toBeDisabled()
    await page.goto('./#/rsvp')
    await expect(page.getByText('Ruta no encontrada')).toBeVisible()
    await page.goto('./#/admin')
    await expect(page.getByLabel('Contraseña')).toBeVisible()
    await expect(page.getByRole('button', {name: 'Entrar al panel'})).toBeVisible()
})

test('RSVP permite declinar y confirma el guardado', async ({page}) => {
    await page.route('**/rest/v1/rsvp_responses*', route => route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: '[]',
    }))
    await page.goto('./#/rsvp')

    await page.getByLabel('Nombre y apellidos *').fill('Invitada de Prueba')
    await page.getByLabel('No podré asistir').check()
    await page.getByRole('button', {name: 'Confirmar todo'}).click()

    await expect(page.getByRole('heading', {name: '¡Muchas gracias!'})).toBeVisible()
    await expect(page.getByText('Lamentamos que no puedas asistir. Te echaremos de menos.')).toBeVisible()
})

test('RSVP completa el recorrido afirmativo multipaso', async ({page}) => {
    await page.route('**/rest/v1/rsvp_responses*', route => route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: '[]',
    }))
    await page.goto('./#/rsvp')

    await page.getByLabel('Nombre y apellidos *').fill('Pareja de Prueba')
    await page.getByLabel('Sí, ¡allí estaré!').check()
    await page.getByRole('button', {name: 'Siguiente'}).click()
    await expect(page.getByRole('heading', {name: 'Banquete y logística'})).toBeVisible()

    await page.getByLabel('Ninguna, como de todo').check()
    await page.getByRole('button', {name: 'Siguiente'}).click()
    await expect(page.getByRole('heading', {name: 'Luna de miel y ritmo'})).toBeVisible()

    await page.getByLabel('Canción para la pista').fill('Canción de prueba')
    await page.getByRole('button', {name: 'Siguiente'}).click()
    await page.getByLabel('Tu mensaje').fill('Mensaje ficticio para el test')
    await page.getByRole('button', {name: 'Confirmar todo'}).click()

    await expect(page.getByText('Tu asistencia ha sido confirmada. ¡Nos vemos pronto!')).toBeVisible()
})

test('RSVP mantiene los datos y muestra un error recuperable cuando falla la API', async ({page}) => {
    await page.route('**/rest/v1/rsvp_responses*', route => route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({message: 'Synthetic test failure'}),
    }))
    await page.goto('./#/rsvp')

    await page.getByLabel('Nombre y apellidos *').fill('Invitado de Prueba')
    await page.getByLabel('No podré asistir').check()
    await page.getByRole('button', {name: 'Confirmar todo'}).click()

    await expect(page.getByRole('alert')).toContainText('Hubo un error al guardar tu asistencia')
    await expect(page.getByLabel('Nombre y apellidos *')).toHaveValue('Invitado de Prueba')
})

test('Admin protege la lectura detrás del acceso con credenciales', async ({page}) => {
    await page.goto('./#/admin')

    await expect(page.getByRole('heading', {name: 'Respuestas RSVP'})).toBeVisible()
    await expect(page.getByLabel('Correo electrónico')).toBeVisible()
    await expect(page.getByLabel('Contraseña')).toBeVisible()
    await expect(page.getByRole('button', {name: 'Entrar al panel'})).toBeVisible()
    await expect(page.getByText('El acceso está limitado a las personas autorizadas para esta invitación.')).toBeVisible()
})

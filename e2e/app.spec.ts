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

test('El deadline cierra CTA y ruta RSVP sin ocultar Admin', async ({page}) => {
    await page.clock.setFixedTime(new Date('2027-05-13T00:00:00+02:00'))
    await page.goto('./')

    await expect(page.getByRole('button', {name: 'Confirmación cerrada'})).toBeDisabled()
    await page.goto('./#/rsvp')
    await expect(page.getByText('Ruta no encontrada')).toBeVisible()
    await page.goto('./#/admin')
    await expect(page.getByRole('button', {name: 'Enviar código'})).toBeVisible()
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

test('Admin protege la lectura detrás del acceso por email', async ({page}) => {
    await page.goto('./#/admin')

    await expect(page.getByRole('heading', {name: 'Respuestas RSVP'})).toBeVisible()
    await expect(page.getByLabel('Correo electrónico')).toBeVisible()
    await expect(page.getByRole('button', {name: 'Enviar código'})).toBeVisible()
    await expect(page.getByText('El acceso está limitado a las personas autorizadas para esta invitación.')).toBeVisible()
})

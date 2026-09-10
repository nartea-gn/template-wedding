import {expect, test} from '@playwright/test'

test.beforeEach(async ({page}) => {
    await page.clock.setFixedTime(new Date('2026-08-03T12:00:00+02:00'))
})

test('Landing presenta la invitación y permite llegar al RSVP', async ({page}) => {
    await page.goto('./')

    await expect(page.getByRole('heading', {name: /Gala.*Valentin/})).toBeVisible()
    await expect(page.getByText('Falta para el gran día')).toBeVisible()

    // La invitacion declara la llamada una sola vez, al cierre. El conteo se afirma a proposito:
    // el tipo `rsvp-cta` se puede declarar mas veces, y este test es lo que fija que aqui no.
    const rsvpLink = page.getByRole('link', {name: 'Confirmar asistencia'})
    await expect(rsvpLink).toHaveCount(1)
    await rsvpLink.click()

    await expect(page).toHaveURL(/\/rsvp$/)
    await expect(page.getByRole('heading', {name: 'Asistencia'})).toBeVisible()
})

test('El selector móvil mantiene visibles las tres opciones de mapas', async ({page}) => {
    await page.setViewportSize({width: 360, height: 740})
    await page.emulateMedia({reducedMotion: 'reduce'})
    await page.goto('./')

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
    await page.goto('./')

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
    await page.goto('./')

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

test('El deadline cierra el CTA y explica el cierre, sin ocultar Admin', async ({page}) => {
    await page.clock.setFixedTime(new Date('2027-05-13T00:00:00+02:00'))
    await page.goto('./')

    // Cerrado no es inoperante: el enlace lleva a la pagina que cuenta que el plazo termino, en
    // lugar de dejar al invitado ante un boton muerto sin explicacion ni salida.
    const closedCta = page.getByRole('link', {name: 'Confirmación cerrada'}).first()
    await expect(closedCta).toBeVisible()
    await closedCta.click()
    await expect(page).toHaveURL(/\/rsvp$/)
    await expect(page.getByRole('heading', {name: 'El plazo ha finalizado'})).toBeVisible()
    await expect(page.getByRole('link', {name: 'Volver al inicio'})).toBeVisible()
    await page.goto('./')

    // Un enlace guardado tiene que llegar a la página de cierre, no al comodín: cerrar no es
    // lo mismo que fallar. La ruta se registra siempre y es Rsvp quien decide qué pinta.
    await page.goto('./rsvp')
    await expect(page.getByRole('heading', {name: 'El plazo ha finalizado'})).toBeVisible()
    await expect(page.getByText('Ruta no encontrada')).toHaveCount(0)

    await page.goto('./admin')
    await expect(page.getByLabel('Contraseña', {exact: true})).toBeVisible()
    await expect(page.getByRole('button', {name: 'Entrar al panel'})).toBeVisible()
})

test('RSVP permite declinar y confirma el guardado', async ({page}) => {
    await page.route('**/rest/v1/rsvp_responses*', route => route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: '[]',
    }))
    await page.goto('./rsvp')

    await page.getByLabel('Nombre y apellidos').fill('Invitada de Prueba')
    await page.getByLabel('No podré asistir').check()
    // Quien no puede ir tambien pasa por la dedicatoria, que es el unico paso abierto a las dos
    // respuestas: sigue teniendo algo que decir.
    await page.getByRole('button', {name: 'Siguiente'}).click()
    await expect(page.getByRole('heading', {name: 'Dedicatoria'})).toBeVisible()
    await page.getByLabel('Tu mensaje').fill('Os deseo lo mejor')
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
    await page.goto('./rsvp')

    await page.getByLabel('Nombre y apellidos').fill('Pareja de Prueba')
    await page.getByLabel('Sí, ¡allí estaré!').check()
    await page.getByRole('button', {name: 'Siguiente'}).click()
    await expect(page.getByRole('heading', {name: 'Banquete y logística'})).toBeVisible()

    // Los datos dietéticos son datos de salud y se piden directamente, con el aviso encima: el
    // consentimiento es el propio acto de rellenarlos.
    await expect(page.getByText('Es información de salud.', {exact: false})).toBeVisible()
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
    await page.goto('./rsvp')

    await page.getByLabel('Nombre y apellidos').fill('Invitado de Prueba')
    await page.getByLabel('No podré asistir').check()
    await page.getByRole('button', {name: 'Siguiente'}).click()
    await page.getByRole('button', {name: 'Confirmar todo'}).click()

    await expect(page.getByRole('alert')).toContainText('Hubo un error al guardar tu asistencia')

    // El fallo ocurre en la dedicatoria, asi que el nombre no esta en pantalla: se comprueba que
    // sigue ahi volviendo atras, que es lo que de verdad importa -- que no se pierda nada.
    await page.getByRole('button', {name: 'Atrás'}).click()
    await expect(page.getByLabel('Nombre y apellidos')).toHaveValue('Invitado de Prueba')
})

test('Admin protege la lectura detrás del acceso con credenciales', async ({page}) => {
    await page.goto('./admin')

    await expect(page.getByRole('heading', {name: 'Respuestas RSVP'})).toBeVisible()
    await expect(page.getByLabel('Correo electrónico')).toBeVisible()
    await expect(page.getByLabel('Contraseña', {exact: true})).toBeVisible()
    await expect(page.getByRole('button', {name: 'Entrar al panel'})).toBeVisible()
    await expect(page.getByText('El acceso está limitado a las personas autorizadas para esta invitación.')).toBeVisible()
})

// El enlace de salto apunta a `#main-content`, un ancla del documento. Mientras el enrutado vivió
// en el fragmento, activarlo dejaba la URL en `#main-content`, que el router leía como ruta, no
// encontraba y resolvía con el comodín: el primer elemento enfocable de la invitación borraba la
// página, justo para quien usa teclado o lector de pantalla. Con rutas reales el fragmento vuelve
// a ser solo un ancla. Este test fija las dos mitades, foco y contenido, y sobrevive a cualquier
// enrutado posterior.
test('El enlace de salto lleva el foco al contenido sin descartar la página', async ({page}) => {
    await page.goto('./')

    const skipLink = page.getByRole('link', {name: 'Saltar al contenido'})

    // WebKit sólo mueve el foco a un enlace con Tab cuando Safari tiene activado «Pulsar Tab para
    // resaltar cada elemento de una página web», y el WebKit de Playwright lo trae desactivado.
    // Pulsar Tab aquí afirmaba una preferencia del navegador, no la página, así que fallaba en
    // `webkit` y en `mobile-webkit` -- sin que nadie lo viera, porque la matriz no entra en CI.
    // Que el enlace sea el primer elemento enfocable se comprueba por estructura; el foco se
    // coloca a mano y lo que de verdad importa, que activarlo lleve el foco al contenido, se
    // ejercita igual con el teclado.
    const firstFocusable = page
        .locator('a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])')
        .first()
    await expect(firstFocusable).toHaveAttribute('href', '#main-content')

    await skipLink.focus()
    await expect(skipLink).toBeFocused()

    await page.keyboard.press('Enter')

    await expect(page.locator('#main-content')).toBeFocused()
    await expect(page.getByRole('heading', {name: /Gala.*Valentin/})).toBeVisible()
    await expect(page.getByText('Ruta no encontrada')).toHaveCount(0)
})

test('los datos de la cuenta se alinean en columna a cualquier ancho', async ({page}) => {
    // Cada fila era una linea flex centrada y dimensionada por su contenido, asi que la x de cada
    // parte dependia de lo que midiera esa fila: medido antes del arreglo, hasta 78 px de
    // dispersion entre los valores, y el boton caia a una segunda linea en unas filas y no en
    // otras. Se afirma la alineacion y no el diseno concreto: lo que no puede volver es que las
    // tres filas empiecen en sitios distintos.
    for (const width of [320, 390, 768, 1440]) {
        await page.setViewportSize({width, height: 900})
        await page.goto('./')
        await page.getByRole('button', {name: 'Ver el número de cuenta'}).click()

        const columnas = await page.locator('.landing-gifts-detail').evaluateAll(rows => {
            const x = element => Math.round(element.getBoundingClientRect().x)
            const derecha = element => Math.round(element.getBoundingClientRect().right)
            // Arrays y no `Set`: un `Set` cruza el puente de Playwright como `{}`.
            return {
                etiquetas: rows.map(row => x(row.querySelector('.landing-gifts-detail-label'))),
                valores: rows.map(row => x(row.querySelector('.landing-gifts-detail-value'))),
                botones: rows.map(row => derecha(row.querySelector('button'))),
                filasX: rows.map(row => x(row)),
                filasDerecha: rows.map(row => derecha(row)),
            }
        })

        expect(columnas.etiquetas, `filas a ${width} px`).toHaveLength(3)
        expect([...new Set(columnas.etiquetas)], `etiquetas a ${width} px`).toHaveLength(1)
        expect([...new Set(columnas.valores)], `valores a ${width} px`).toHaveLength(1)
        expect([...new Set(columnas.botones)], `botones a ${width} px`).toHaveLength(1)

        // Que coincidan entre si no basta: tres filas centradas a la vez tambien coinciden, y ese
        // es justo el estado del que se viene. Las columnas tienen que empezar y acabar en los
        // bordes del bloque.
        expect(columnas.etiquetas[0], `etiquetas al borde a ${width} px`).toBe(columnas.filasX[0])
        expect(columnas.valores[0], `valores al borde a ${width} px`).toBe(columnas.filasX[0])
        expect(columnas.botones[0], `botones al borde a ${width} px`).toBe(columnas.filasDerecha[0])
    }
})

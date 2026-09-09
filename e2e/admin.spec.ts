import {expect, test, type Page} from '@playwright/test'
import {ADMIN_DATASET, ADMIN_DATASET_COUNTS as COUNTS, breakServer, signInToAdminPanel} from './fixtures/admin-panel'

/*
 * Controles de lectura del panel: filtros, busqueda, paginacion y exportacion.
 *
 * Fichero aparte de `themes.spec.ts` a proposito. Alli el panel entra en la matriz de temas
 * porque lo que se comprueba es visual -- centrado, escala, desbordes -- y eso si cambia con la
 * tipografia de cada tema. Lo de aqui es comportamiento: filtrar por autobus devuelve las mismas
 * tres filas en los siete temas, asi que multiplicarlo por siete solo compraria minutos de CI.
 *
 * Un tema, un ancho, y el conjunto de catorce filas de `ADMIN_DATASET`.
 */

test.beforeEach(async ({page}) => {
    await page.clock.setFixedTime(new Date('2026-08-03T12:00:00+02:00'))
    await page.emulateMedia({reducedMotion: 'reduce'})
    await page.setViewportSize({width: 1440, height: 1200})
})

test('los filtros reparten las respuestas en las vistas que el catering necesita', async ({page}) => {
    await signInToAdminPanel(page, ADMIN_DATASET)

    // El recuento vive en un `aria-live`, asi que se lee de la pantalla y no del array: es lo que
    // la pareja ve, y lo que se rompe si el filtro cuenta una cosa y pinta otra.
    await expectResultCount(page, COUNTS.live, COUNTS.live)
    await expect(page.getByRole('row')).toHaveCount(COUNTS.pageSize + 1)

    for (const [option, expected] of [
        ['Confirmados', COUNTS.confirmed],
        ['Declinados', COUNTS.declined],
        ['Necesitan bus', COUNTS.bus],
        ['Necesidades alimentarias', COUNTS.dietary],
        ['Eliminadas', COUNTS.deleted],
    ] as const) {
        await page.getByLabel('Filtrar:').selectOption({label: option})
        await expectResultCount(page, expected, COUNTS.live)
        // `+1` es la fila de cabecera, que tambien es un `row`.
        await expect(page.getByRole('row')).toHaveCount(Math.min(expected, COUNTS.pageSize) + 1)
    }

    // Las borradas solo salen en su vista. Es la unica garantia de que un borrado en blando no se
    // cuela en la exportacion que se manda al catering.
    await expect(page.getByRole('cell', {name: 'Lucas Borrado'})).toBeVisible()
    await page.getByLabel('Filtrar:').selectOption({label: 'Todos'})
    await expect(page.getByRole('cell', {name: 'Lucas Borrado'})).toHaveCount(0)
})

test('la búsqueda encuentra por nombre y se combina con el filtro', async ({page}) => {
    await signInToAdminPanel(page, ADMIN_DATASET)

    await page.getByLabel('Buscar invitado').fill(COUNTS.uniqueName)
    await expectResultCount(page, 1, COUNTS.live)
    await expect(page.getByRole('cell', {name: 'Zenobia Singular'})).toBeVisible()

    // Sin distinguir mayusculas: quien busca a un invitado no escribe su nombre en capital.
    await page.getByLabel('Buscar invitado').fill(COUNTS.uniqueName.toLowerCase())
    await expectResultCount(page, 1, COUNTS.live)

    // Filtro y busqueda se cruzan, no se sustituyen: Zenobia confirma, asi que sigue estando en
    // "Confirmados" y desaparece en "Declinados".
    await page.getByLabel('Filtrar:').selectOption({label: 'Confirmados'})
    await expectResultCount(page, 1, COUNTS.live)
    await page.getByLabel('Filtrar:').selectOption({label: 'Declinados'})
    await expectResultCount(page, 0, COUNTS.live)

    await page.getByLabel('Buscar invitado').fill('nombre que no existe')
    await page.getByLabel('Filtrar:').selectOption({label: 'Todos'})
    await expectResultCount(page, 0, COUNTS.live)
    await expect(page.getByRole('row')).toHaveCount(0)
})

test('la paginación recorre las páginas y el selector de tamaño las recalcula', async ({page}) => {
    await signInToAdminPanel(page, ADMIN_DATASET)

    const pagination = page.getByRole('navigation', {name: 'Páginas de respuestas'})
    await expect(pagination).toContainText(`Página 1 de ${COUNTS.pages}`)
    await expect(pagination.getByRole('button', {name: 'Anterior'})).toBeDisabled()
    await expect(page.getByRole('row')).toHaveCount(COUNTS.pageSize + 1)

    await pagination.getByRole('button', {name: 'Siguiente'}).click()
    await expect(pagination).toContainText(`Página ${COUNTS.pages} de ${COUNTS.pages}`)
    await expect(pagination.getByRole('button', {name: 'Siguiente'})).toBeDisabled()
    // El resto de las doce vivas: dos filas y su cabecera.
    await expect(page.getByRole('row')).toHaveCount(COUNTS.live - COUNTS.pageSize + 1)

    await pagination.getByRole('button', {name: 'Anterior'}).click()
    await expect(pagination).toContainText(`Página 1 de ${COUNTS.pages}`)

    // Con 25 por pagina las doce caben en una, y `PaginationControls` se retira: por debajo de dos
    // paginas devuelve `null` en vez de dejar una barra con un solo destino.
    await page.getByLabel('Filas por página').selectOption('25')
    await expect(page.getByRole('row')).toHaveCount(COUNTS.live + 1)
    await expect(pagination).toHaveCount(0)
})

test('exportar CSV entrega solo lo que el filtro deja a la vista', async ({page}) => {
    await signInToAdminPanel(page, ADMIN_DATASET)

    const everything = await downloadCsv(page)
    // Cabecera mas las doce vivas. Las dos borradas no viajan.
    expect(everything.rows).toHaveLength(COUNTS.live + 1)
    expect(everything.text).toContain('Ana Confirmada')
    expect(everything.text).toContain('Hugo Declinado')
    expect(everything.text).not.toContain('Lucas Borrado')
    // El nombre lleva el subconjunto y la marca de tiempo: exportar dos veces el mismo dia
    // producia dos ficheros con el mismo nombre y no habia forma de distinguirlos.
    expect(everything.filename).toBe('gala-y-valentin-rsvp-all-2026-08-03-1000.csv')

    // La exportacion sale de lo presentado, no de todo lo descargado: es lo que hace que "dame los
    // que necesitan bus" sea un fichero de tres y no uno de doce que hay que repasar a mano.
    await page.getByLabel('Filtrar:').selectOption({label: 'Necesitan bus'})
    const bus = await downloadCsv(page)
    expect(bus.rows).toHaveLength(COUNTS.bus + 1)
    expect(bus.text).toContain('Ana Confirmada')
    expect(bus.text).not.toContain('Fabio Confirmado')
    expect(bus.filename).toBe('gala-y-valentin-rsvp-bus-2026-08-03-1000.csv')

    // Sin nada que exportar el boton no ofrece un fichero vacio.
    await page.getByLabel('Buscar invitado').fill('nombre que no existe')
    await expect(page.getByRole('button', {name: 'Exportar CSV'})).toBeDisabled()
})

test('la ordenación recorre los cuatro criterios', async ({page}) => {
    await signInToAdminPanel(page, ADMIN_DATASET)

    // `ADMIN_DATASET` crece en fecha y en alfabeto a la vez -- Ana es la primera de julio y la
    // primera por nombre -- salvo Zenobia, que es del dia 8 y la ultima del alfabeto. Esa es la
    // fila que distingue ordenar por fecha de ordenar por nombre: sin ella, los cuatro criterios
    // darian el mismo resultado en dos parejas y el test pasaria con dos de ellos intercambiados.
    for (const [option, first] of [
        ['Más recientes', 'Karla Declinada'],
        ['Más antiguos', 'Ana Confirmada'],
        ['Invitado A–Z', 'Ana Confirmada'],
        ['Invitado Z–A', 'Zenobia Singular'],
    ] as const) {
        await page.getByLabel('Ordenar por').selectOption({label: option})
        await expect(firstDataRow(page)).toContainText(first)
    }

    // Y que el ultimo tambien cambie: comprobar solo el primero deja pasar un orden que acierta
    // la cabeza y no el resto. Decimo de la primera pagina en Z-A: Zenobia, Karla, Julio, Irene,
    // Hugo, Gema, Fabio, Elena, Diego, Carla.
    await page.getByLabel('Ordenar por').selectOption({label: 'Invitado Z–A'})
    await expect(page.getByRole('row').nth(COUNTS.pageSize)).toContainText('Carla Confirmada')

    // El orden sobrevive al filtro, que es lo que hace util "los del bus, por nombre".
    await page.getByLabel('Ordenar por').selectOption({label: 'Invitado A–Z'})
    await page.getByLabel('Filtrar:').selectOption({label: 'Necesitan bus'})
    await expect(firstDataRow(page)).toContainText('Ana Confirmada')
    await page.getByLabel('Ordenar por').selectOption({label: 'Invitado Z–A'})
    await expect(firstDataRow(page)).toContainText('Carla Confirmada')
})

test('editar una respuesta la guarda y la deja en la tabla', async ({page}) => {
    await signInToAdminPanel(page, ADMIN_DATASET)

    await page.getByLabel('Buscar invitado').fill(COUNTS.uniqueName)
    await firstDataRow(page).getByRole('button', {name: 'Editar'}).click()

    // El nombre del invitado va en el nombre accesible del dialogo: con doce filas, "Editar" a
    // secas no dice de quien es el registro que se esta cambiando.
    //
    // El locator se ata al rol y no al nombre, aunque el nombre sea justo lo que se comprueba: se
    // recalcula desde el campo mientras se escribe, asi que un locator con el nombre de partida
    // deja de resolver en cuanto se corrige el nombre, y el fallo se lee como "no encuentro el
    // radio" en lugar de "el dialogo se llama de otra forma".
    const modal = page.getByRole('dialog')
    await expect(modal).toHaveAttribute('aria-label', 'Editar · Zenobia Singular')

    // El primer campo recibe el foco al abrir. Sin esto, un usuario de teclado entraba al modal
    // por el final.
    await expect(modal.getByLabel('Nombre y apellidos')).toBeFocused()

    await modal.getByLabel('Nombre y apellidos').fill('Zenobia Corregida')
    await modal.getByRole('radio', {name: 'No podré asistir'}).check()
    await modal.getByRole('button', {name: 'Guardar'}).click()

    await expect(modal).toHaveCount(0)
    await expect(page.getByText('Respuesta actualizada')).toBeVisible()

    // Lo guardado, no lo pintado: la busqueda sigue filtrando por `Zenobia`, asi que la fila solo
    // sigue ahi si el cambio llego al servidor de mentira y volvio en el `GET`.
    await expect(firstDataRow(page)).toContainText('Zenobia Corregida')
    await expect(firstDataRow(page)).toContainText('No')

    // Y que se recuenta: Zenobia confirmaba, asi que ahora esta entre las declinadas.
    await page.getByLabel('Buscar invitado').fill('')
    await page.getByLabel('Filtrar:').selectOption({label: 'Declinados'})
    await expectResultCount(page, COUNTS.declined + 1, COUNTS.live)
})

test('el modal de edición no pierde lo escrito ni deja el foco suelto', async ({page}) => {
    await signInToAdminPanel(page, ADMIN_DATASET)

    await page.getByLabel('Buscar invitado').fill(COUNTS.uniqueName)
    const editButton = firstDataRow(page).getByRole('button', {name: 'Editar'})
    await editButton.click()
    const modal = page.getByRole('dialog')

    // Con cambios sin guardar, un toque en el fondo no cierra: en un movil el backdrop es casi
    // todo lo que rodea al modal, y era una via de perdida de datos a un dedo de distancia.
    await modal.getByLabel('Tu mensaje').fill('Un texto que no se debe perder')
    await page.locator('.modal-backdrop').click({position: {x: 5, y: 5}})
    await expect(modal).toBeVisible()
    await expect(modal.getByLabel('Tu mensaje')).toHaveValue('Un texto que no se debe perder')

    // Escape si cierra: es un acto deliberado. Y el foco vuelve al boton que lo abrio, en vez de
    // quedarse en `BODY` y obligar a recorrer la pagina desde el enlace de salto.
    await page.keyboard.press('Escape')
    await expect(modal).toHaveCount(0)
    await expect(editButton).toBeFocused()

    // Sin cambios, el fondo si cierra.
    await editButton.click()
    await expect(page.getByRole('dialog')).toBeVisible()
    await page.locator('.modal-backdrop').click({position: {x: 5, y: 5}})
    await expect(page.getByRole('dialog')).toHaveCount(0)
})

/** La primera fila de datos: la 0 es la cabecera, que también es un `row`. */
function firstDataRow(page: Page) {
    return page.getByRole('row').nth(1)
}

test('eliminar pide confirmación, y cancelarla no borra nada', async ({page}) => {
    await signInToAdminPanel(page, ADMIN_DATASET)
    await page.getByLabel('Buscar invitado').fill(COUNTS.uniqueName)

    // La confirmacion es en linea y sustituye al boton que se acaba de pulsar, en lugar de un
    // dialogo: la respuesta se queda al lado de la fila que afecta.
    await firstDataRow(page).getByRole('button', {name: 'Eliminar'}).click()
    const confirmation = page.getByRole('group', {name: '¿Eliminar la respuesta de Zenobia Singular?'})
    await expect(confirmation).toBeVisible()
    // El foco va al boton que descarta: la tecla Enter de paso no debe borrar a un invitado.
    await expect(confirmation.getByRole('button', {name: 'Cancelar'})).toBeFocused()

    await confirmation.getByRole('button', {name: 'Cancelar'}).click()
    await expect(confirmation).toHaveCount(0)
    await expect(firstDataRow(page)).toContainText('Zenobia Singular')
    await page.getByLabel('Buscar invitado').fill('')
    await expectResultCount(page, COUNTS.live, COUNTS.live)
})

test('eliminar y restaurar mueven la respuesta entre las dos vistas', async ({page}) => {
    await signInToAdminPanel(page, ADMIN_DATASET)
    await page.getByLabel('Buscar invitado').fill(COUNTS.uniqueName)

    await firstDataRow(page).getByRole('button', {name: 'Eliminar'}).click()
    await page.getByRole('button', {name: 'Sí, eliminar'}).click()
    await expect(page.getByText('Respuesta eliminada')).toBeVisible()

    // Fuera de todas las vistas menos la suya: es lo que impide que un borrado en blando siga
    // viajando en el CSV que se manda al catering.
    // El total tambien baja: `totalResponses` cuenta las vivas, asi que borrar una la quita de
    // los dos lados del "N de M".
    await page.getByLabel('Buscar invitado').fill('')
    await expectResultCount(page, COUNTS.live - 1, COUNTS.live - 1)
    await page.getByLabel('Filtrar:').selectOption({label: 'Eliminadas'})
    await expectResultCount(page, COUNTS.deleted + 1, COUNTS.live - 1)
    await expect(page.getByRole('cell', {name: 'Zenobia Singular'})).toBeVisible()

    // Y en la vista de eliminadas la accion que se ofrece es restaurar, no volver a eliminar.
    const deletedRow = page.getByRole('row').filter({hasText: 'Zenobia Singular'})
    await expect(deletedRow.getByRole('button', {name: 'Eliminar'})).toHaveCount(0)
    await deletedRow.getByRole('button', {name: 'Restaurar'}).click()
    await expect(page.getByText('Respuesta restaurada')).toBeVisible()

    await expectResultCount(page, COUNTS.deleted, COUNTS.live)
    await page.getByLabel('Filtrar:').selectOption({label: 'Todos'})
    await expectResultCount(page, COUNTS.live, COUNTS.live)
    await expect(page.getByRole('cell', {name: 'Zenobia Singular'})).toBeVisible()
})

test('el control de plazo guarda el switch manual y refleja el estado que vuelve', async ({page}) => {
    // Se vigila lo que se manda, no solo lo que se pinta: el switch y la fecha viajan en el mismo
    // guardado, y el fallo que este control ya tuvo fue enviar `override: null` al guardar solo
    // una fecha, reabriendo un formulario que la pareja habia cerrado a mano.
    const writes: Record<string, unknown>[] = []
    page.on('request', request => {
        if (request.method() === 'PATCH' && request.url().includes('/rest/v1/invitations')) {
            writes.push(JSON.parse(request.postData() ?? '{}') as Record<string, unknown>)
        }
    })
    await signInToAdminPanel(page, ADMIN_DATASET)

    const closure = page.locator('.admin-rsvp-closure')
    await expect(closure.getByText('Las confirmaciones están abiertas.')).toBeVisible()
    await expect(closure.getByRole('radio', {name: 'Automático, según la fecha'})).toBeChecked()
    // La fecha del `datetime-local` sale del plazo que hay en la base, no de un valor de partida.
    await expect(closure.getByLabel('Fecha límite')).toHaveValue('2027-05-12T23:59')

    await closure.getByRole('radio', {name: 'Cerrado ya'}).check()
    await closure.getByRole('button', {name: 'Guardar plazo'}).click()

    // Confirmacion explicita: este control solo avisaba al fallar, asi que un exito no se
    // distinguia de no haber pulsado.
    await expect(closure.getByText('Plazo guardado.')).toBeVisible()
    await expect(closure.getByText('Las confirmaciones están cerradas.')).toBeVisible()
    expect(writes).toHaveLength(1)
    expect(writes[0]).toMatchObject({rsvp_override: 'closed'})
    // La fecha viaja junto al switch, y con los segundos a cero: `datetime-local` solo llega al
    // minuto, asi que el plazo guardado en la base -- 23:59:59 local -- vuelve como 23:59:00 en
    // cuanto la pareja guarda cualquier cosa. Se afirma tal cual y no redondeado a proposito: es
    // una perdida de precision real, y si algun dia se corrige este test debe enterarse.
    expect(writes[0].rsvp_deadline_utc).toBe('2027-05-12T21:59:00.000Z')

    // Y volver a automatico devuelve la decision a la fecha, que aun no ha pasado.
    await closure.getByRole('radio', {name: 'Automático, según la fecha'}).check()
    await closure.getByRole('button', {name: 'Guardar plazo'}).click()
    await expect(closure.getByText('Las confirmaciones están abiertas.')).toBeVisible()
    expect(writes).toHaveLength(2)
    expect(writes[1]).toMatchObject({rsvp_override: null})
})

/*
 * Caminos de fallo.
 *
 * Cada accion del panel escribe en la base y ninguna puede fallar en silencio: la pareja tiene
 * que poder distinguir "no se guardo" de "no pulse". Lo que se comprueba en cada caso es que el
 * fallo se dice, que no se pierde lo escrito, y que reintentar con la red sana funciona -- que es
 * la diferencia entre "reintentar" y "escribirlo todo otra vez".
 */

test('si la lectura falla, la tabla lo dice y reintentar la recupera', async ({page}) => {
    await signInToAdminPanel(page, ADMIN_DATASET)
    await expectResultCount(page, COUNTS.live, COUNTS.live)

    const repair = await breakServer(page, '**/rest/v1/rsvp_responses*', 'GET')
    await page.getByRole('button', {name: 'Refrescar'}).click()

    const failure = page.locator('.responses-state--error')
    await expect(failure).toBeVisible()
    await expect(failure).toHaveAttribute('role', 'alert')
    // El error de la base se muestra tal cual cuando llega; el texto propio del panel es el
    // respaldo para cuando no hay ninguno.
    await expect(failure).toContainText('Synthetic test failure')

    await repair()
    await failure.getByRole('button', {name: 'Reintentar'}).click()
    await expect(failure).toHaveCount(0)
    await expectResultCount(page, COUNTS.live, COUNTS.live)
})

test('si guardar una edición falla, el modal se queda con lo escrito', async ({page}) => {
    await signInToAdminPanel(page, ADMIN_DATASET)
    await page.getByLabel('Buscar invitado').fill(COUNTS.uniqueName)
    await firstDataRow(page).getByRole('button', {name: 'Editar'}).click()

    const modal = page.getByRole('dialog')
    await modal.getByLabel('Nombre y apellidos').fill('Zenobia Corregida')
    await modal.getByLabel('Tu mensaje').fill('Un texto que no se debe perder')

    const repair = await breakServer(page, '**/rest/v1/rsvp_responses*', 'PATCH')
    await modal.getByRole('button', {name: 'Guardar'}).click()

    // El modal sobrevive al fallo. Cerrarlo descartaria todo lo que la pareja acaba de escribir.
    await expect(modal).toBeVisible()
    await expect(modal.getByRole('alert')).toContainText('No se han podido guardar los cambios de Zenobia Corregida')
    await expect(modal.getByLabel('Nombre y apellidos')).toHaveValue('Zenobia Corregida')
    await expect(modal.getByLabel('Tu mensaje')).toHaveValue('Un texto que no se debe perder')
    await expect(page.getByText('Respuesta actualizada')).toHaveCount(0)

    // Y con la red sana, el mismo borrador se guarda sin volver a teclearlo.
    await repair()
    await modal.getByRole('button', {name: 'Guardar'}).click()
    await expect(modal).toHaveCount(0)
    await expect(page.getByText('Respuesta actualizada')).toBeVisible()
    await expect(firstDataRow(page)).toContainText('Zenobia Corregida')
})

test('si borrar o restaurar falla, el aviso queda en la fila y la respuesta no se mueve', async ({page}) => {
    await signInToAdminPanel(page, ADMIN_DATASET)
    await page.getByLabel('Buscar invitado').fill(COUNTS.uniqueName)

    let repair = await breakServer(page, '**/rest/v1/rsvp_responses*', 'PATCH')
    await firstDataRow(page).getByRole('button', {name: 'Eliminar'}).click()
    await page.getByRole('button', {name: 'Sí, eliminar'}).click()

    // El aviso es de la fila, no de la tabla: reusar el banner de carga sustituia las doce filas
    // por un fallo que solo afectaba a una.
    await expect(page.locator('.responses-row-error')).toContainText('No se ha podido completar la acción sobre esta respuesta')
    await expect(page.locator('.responses-state--error')).toHaveCount(0)
    await expect(firstDataRow(page)).toContainText('Zenobia Singular')
    await expect(page.getByText('Respuesta eliminada')).toHaveCount(0)

    // Con la red sana el borrado sale adelante, y entonces se rompe la restauracion.
    await repair()
    await firstDataRow(page).getByRole('button', {name: 'Eliminar'}).click()
    await page.getByRole('button', {name: 'Sí, eliminar'}).click()
    await expect(page.getByText('Respuesta eliminada')).toBeVisible()

    await page.getByLabel('Filtrar:').selectOption({label: 'Eliminadas'})
    const deletedRow = page.getByRole('row').filter({hasText: 'Zenobia Singular'})
    repair = await breakServer(page, '**/rest/v1/rsvp_responses*', 'PATCH')
    await deletedRow.getByRole('button', {name: 'Restaurar'}).click()

    await expect(page.locator('.responses-row-error')).toContainText('No se ha podido completar la acción sobre esta respuesta')
    await expect(page.getByText('Respuesta restaurada')).toHaveCount(0)
    // Sigue borrada: un fallo al restaurar no puede dejarla ni en un lado ni en el otro.
    await expect(deletedRow).toBeVisible()
    await repair()
})

test('si guardar el plazo falla, lo dice y no se anuncia como guardado', async ({page}) => {
    await signInToAdminPanel(page, ADMIN_DATASET)

    const closure = page.locator('.admin-rsvp-closure')
    await expect(closure.getByText('Las confirmaciones están abiertas.')).toBeVisible()

    const repair = await breakServer(page, '**/rest/v1/invitations*', 'PATCH')
    await closure.getByRole('radio', {name: 'Cerrado ya'}).check()
    await closure.getByRole('button', {name: 'Guardar plazo'}).click()

    await expect(closure.getByRole('alert')).toContainText('No se ha podido guardar el plazo')
    await expect(closure.getByText('Plazo guardado.')).toHaveCount(0)
    // El estado que se muestra sigue siendo el de la base, no el que la pareja acaba de elegir:
    // un guardado fallido no puede leerse como aplicado.
    await expect(closure.getByText('Las confirmaciones están abiertas.')).toBeVisible()
    // Pero la eleccion se queda en el formulario, para poder reintentar sin volver a marcarla.
    await expect(closure.getByRole('radio', {name: 'Cerrado ya'})).toBeChecked()

    await repair()
    await closure.getByRole('button', {name: 'Guardar plazo'}).click()
    await expect(closure.getByText('Plazo guardado.')).toBeVisible()
    await expect(closure.getByText('Las confirmaciones están cerradas.')).toBeVisible()
    await expect(closure.getByRole('alert')).toHaveCount(0)
})

/** Lee el recuento del `aria-live` de la barra de controles: "Resultados: N de M". */
async function expectResultCount(page: Page, shown: number, total: number) {
    await expect(page.locator('.admin-toolbar-results'))
        .toHaveText(`Resultados: ${shown} de ${total}`)
}

/**
 * Pulsa exportar y devuelve el fichero que el navegador ofrece.
 *
 * `downloadCsv` construye un blob y pulsa un enlace que crea y retira en el acto, así que la
 * descarga se espera antes del click: engancharse después llega tarde.
 */
async function downloadCsv(page: Page) {
    const pending = page.waitForEvent('download')
    await page.getByRole('button', {name: 'Exportar CSV'}).click()
    const download = await pending
    const stream = await download.createReadStream()
    const chunks: Buffer[] = []
    for await (const chunk of stream) chunks.push(chunk as Buffer)
    const text = Buffer.concat(chunks).toString('utf8')
    return {
        filename: download.suggestedFilename(),
        text,
        rows: text.trim().split('\n').filter(line => line.trim() !== ''),
    }
}

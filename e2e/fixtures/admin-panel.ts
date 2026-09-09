import {expect, type Page, type Route} from '@playwright/test'

/*
 * Acceso al panel autenticado, con la red fingida.
 *
 * El panel era la unica superficie sin cobertura e2e: entrar exige una sesion de gotrue, y sin
 * ella los tests solo alcanzaban la pantalla de acceso. Se finge el intercambio de credenciales
 * en lugar de inyectar la sesion en `localStorage` a mano: asi el recorrido es el que hace la
 * pareja -- rellenar, pulsar, y que `supabase-js` guarde la sesion donde el sepa -- y no depende
 * de la `storageKey` que el cliente use hoy.
 */

const SESSION_USER = {
    id: '00000000-0000-0000-0000-000000000001',
    aud: 'authenticated',
    role: 'authenticated',
    email: 'pareja@example.com',
    email_confirmed_at: '2026-01-01T00:00:00Z',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    app_metadata: {provider: 'email', providers: ['email']},
    user_metadata: {},
    identities: [],
}

/*
 * `expires_at` cae dentro del instante que fijan los tests con `page.clock`: una sesion ya
 * caducada devolveria a la pantalla de acceso y el fallo se leeria como un problema de layout.
 */
const SESSION = {
    access_token: 'test-access-token',
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: Math.floor(new Date('2026-08-03T13:00:00+02:00').getTime() / 1000),
    refresh_token: 'test-refresh-token',
    user: SESSION_USER,
}

type RowOptions = {
    /** `busOption` distinto de `no` es lo que el panel cuenta como "necesita bus". */
    busOption?: string
    /** Cualquier valor que no sea la opción excluyente `none` cuenta como necesidad alimentaria. */
    dietaryOptions?: readonly string[]
    /** Una fila borrada en blando: sigue llegando del servidor y solo la ve el filtro "Eliminadas". */
    deleted?: boolean
    /** Día de julio en que se creó, para que ordenar por fecha tenga algo que ordenar. */
    day?: number
}

/*
 * Los nombres de campo son los del formulario real, no unos inventados: `busOption` con valores
 * como `ida_vuelta`, y `dietaryOptions` como lista. Un fixture con `needsBus: true` parecia
 * correcto y dejaba la tarjeta de autobus a cero, porque `invitation.ts` declara
 * `transportFieldId: "busOption"` y nadie mira ese otro nombre.
 */
function responseRow(id: number, fullName: string, attending: boolean, options: RowOptions = {}) {
    const {busOption = 'no', dietaryOptions = ['none'], deleted = false, day = 1} = options
    return {
        id,
        created_at: `2026-07-${String(day).padStart(2, '0')}T10:00:00Z`,
        updated_at: null,
        deleted_at: deleted ? '2026-07-20T10:00:00Z' : null,
        deleted_by: deleted ? 'pareja@example.com' : null,
        wedding_slug: 'gala-y-valentin',
        form_id: 'wedding-rsvp',
        form_version: 1,
        locale: 'es',
        answers: {
            fullName,
            attending,
            dietaryOptions,
            dietaryOther: '',
            busOption,
            songRequest: 'Canción de prueba',
            message: 'Mensaje de prueba',
        },
    }
}

/** Las tres filas que ve el panel: una que asiste con autobús, una que declina y una que asiste. */
export const ADMIN_RESPONSE_ROWS = [
    responseRow(1, 'Ana Ejemplo', true, {busOption: 'ida_vuelta'}),
    responseRow(2, 'Bruno Ejemplo', false),
    responseRow(3, 'Clara Ejemplo', true),
]

/*
 * Conjunto para los controles de lectura: doce filas vivas -- una mas de la primera pagina, que
 * son diez -- y dos borradas, que solo el filtro "Eliminadas" muestra.
 *
 * Los recuentos que los tests afirman salen de aqui y estan en `ADMIN_DATASET_COUNTS`, para que
 * cambiar el conjunto no obligue a perseguir numeros sueltos por el fichero de tests.
 */
export const ADMIN_DATASET = [
    responseRow(1, 'Ana Confirmada', true, {day: 1, busOption: 'ida_vuelta'}),
    responseRow(2, 'Bruno Confirmado', true, {day: 2, busOption: 'solo_ida'}),
    responseRow(3, 'Carla Confirmada', true, {day: 3, busOption: 'solo_vuelta'}),
    responseRow(4, 'Diego Confirmado', true, {day: 4, dietaryOptions: ['gluten']}),
    responseRow(5, 'Elena Confirmada', true, {day: 5, dietaryOptions: ['vegetarian', 'lactose']}),
    responseRow(6, 'Fabio Confirmado', true, {day: 6}),
    responseRow(7, 'Gema Confirmada', true, {day: 7}),
    responseRow(8, 'Zenobia Singular', true, {day: 8}),
    responseRow(9, 'Hugo Declinado', false, {day: 9}),
    responseRow(10, 'Irene Declinada', false, {day: 10}),
    responseRow(11, 'Julio Declinado', false, {day: 11}),
    responseRow(12, 'Karla Declinada', false, {day: 12}),
    responseRow(13, 'Lucas Borrado', true, {day: 13, deleted: true}),
    responseRow(14, 'Marta Borrada', false, {day: 14, deleted: true}),
]

/** Lo que cada vista de `ADMIN_DATASET` debe devolver. */
export const ADMIN_DATASET_COUNTS = {
    live: 12,
    confirmed: 8,
    declined: 4,
    bus: 3,
    dietary: 2,
    deleted: 2,
    pageSize: 10,
    /** Doce filas vivas en páginas de diez. */
    pages: 2,
    /** Nombre que no comparte ninguna palabra con el resto, para la búsqueda. */
    uniqueName: 'Zenobia',
}

/**
 * Entra al panel con la sesión fingida y espera a que la tabla esté pintada.
 *
 * Devuelve con el botón de refrescar visible: es el primer control de la cabecera, así que su
 * presencia significa que la sesión se aceptó y el panel ya está montado.
 */
export async function signInToAdminPanel(page: Page, rows: readonly unknown[] = ADMIN_RESPONSE_ROWS) {
    await page.route('**/auth/v1/token**', route => route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(SESSION),
    }))
    await page.route('**/auth/v1/user**', route => route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(SESSION_USER),
    }))
    /*
     * La tabla no es un `fulfill` fijo, sino un servidor de mentira con estado: `GET` devuelve lo
     * que hay y `PATCH` aplica el cambio y responde con la fila actualizada.
     *
     * Hace falta para poder probar la edicion de verdad. `SupabaseRsvpRepository.update` cierra con
     * `.select('*').single()`, asi que espera **un objeto** y no un array; devolverle la lista
     * entera dejaba el modal en un fallo que no era el de la aplicacion. Y sin guardar el cambio,
     * el `GET` siguiente lo desharia y el test no distinguiria "se guardo" de "se pinto".
     */
    const state = rows.map(row => JSON.parse(JSON.stringify(row)) as Record<string, unknown>)
    await page.route('**/rest/v1/rsvp_responses*', async route => {
        const request = route.request()
        if (request.method() !== 'PATCH') {
            return route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify(state),
            })
        }
        // PostgREST recibe el destino en la consulta (`id=eq.4`), no en el cuerpo.
        const targetId = Number(new URL(request.url()).searchParams.get('id')?.replace('eq.', ''))
        const changes = JSON.parse(request.postData() ?? '{}') as Record<string, unknown>
        const target = state.find(row => row.id === targetId)
        if (!target) return route.fulfill({status: 404, contentType: 'application/json', body: '{}'})
        Object.assign(target, changes)
        target.updated_at = '2026-08-03T10:00:00Z'
        return route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(target),
        })
    })
    /*
     * El plazo, con la misma forma que da PostgREST y el mismo estado que guarda.
     *
     * `get_rsvp_status` devuelve **una lista de filas**, y el repositorio lee `[0]`: respondiendo
     * un objeto suelto, `getStatus` lanzaba `RsvpUnregisteredError` y el panel se quedaba en
     * "Comprobando el estado de las confirmaciones...", que es exactamente lo que parecia un
     * control roto y era un fixture mal formado.
     *
     * El `PATCH` a `invitations` escribe en el mismo estado, asi que el `getStatus` que
     * `updateSchedule` hace despues devuelve lo que se acaba de guardar y no lo de antes.
     */
    const schedule = {
        is_open: true,
        deadline_utc: '2027-05-12T21:59:59.000Z',
        override: null as string | null,
    }
    await page.route('**/rest/v1/invitations*', async route => {
        if (route.request().method() !== 'PATCH') {
            return route.fulfill({status: 200, contentType: 'application/json', body: '[]'})
        }
        const changes = JSON.parse(route.request().postData() ?? '{}') as Record<string, unknown>
        if ('rsvp_deadline_utc' in changes) schedule.deadline_utc = String(changes.rsvp_deadline_utc)
        if ('rsvp_override' in changes) {
            schedule.override = changes.rsvp_override === null ? null : String(changes.rsvp_override)
        }
        // Lo que decide la apertura en la base: el switch manual gana, y si no lo hay manda la fecha.
        schedule.is_open = schedule.override === 'open'
            ? true
            : schedule.override === 'closed'
                ? false
                : Date.parse(schedule.deadline_utc) > Date.parse('2026-08-03T10:00:00Z')
        return route.fulfill({status: 204, body: ''})
    })
    // El comodin se registra ANTES que la ruta concreta: Playwright resuelve de la ultima
    // registrada a la primera, asi que al revés este `[]` se comía la respuesta de
    // `get_rsvp_status` y el panel se quedaba en "Comprobando el estado...".
    await page.route('**/rest/v1/rpc/**', route => route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: '[]',
    }))
    await page.route('**/rest/v1/rpc/get_rsvp_status*', route => route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([schedule]),
    }))

    await page.goto('./admin')
    await page.getByLabel('Correo electrónico').fill(SESSION_USER.email)
    await page.getByLabel('Contraseña', {exact: true}).fill('contrasena-de-prueba')
    await page.getByRole('button', {name: 'Entrar al panel'}).click()
    await expect(page.getByRole('button', {name: 'Refrescar'})).toBeVisible()
}

/**
 * Rompe el servidor para un método y una URL, y devuelve cómo repararlo.
 *
 * Se registra después de las rutas del panel a propósito: Playwright resuelve de la última
 * registrada a la primera, así que esta gana mientras esté puesta y `route.fallback()` devuelve
 * el control a la del fixture cuando el método no es el que se quiere romper.
 *
 * El mensaje viaja con la forma que da PostgREST, porque el panel muestra `error.message` cuando
 * existe y solo cae en su propio texto si no lo hay.
 */
export async function breakServer(page: Page, pattern: string, method: string) {
    const handler = async (route: Route) => {
        if (route.request().method() !== method) return route.fallback()
        return route.fulfill({
            status: 500,
            contentType: 'application/json',
            body: JSON.stringify({message: 'Synthetic test failure'}),
        })
    }
    await page.route(pattern, handler)
    return () => page.unroute(pattern, handler)
}

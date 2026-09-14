import {beforeEach, describe, expect, it, vi} from 'vitest'
import {render, screen, within} from '@testing-library/react'
import {LocalizationContext, type LocalizationContextValue} from '../../app/providers/LocalizationContext'
import {ResponsesTable} from '../../components/admin/ResponsesTable'
import {buildResponsesCsv} from '../../features/admin/export/buildResponsesCsv'

/**
 * Construye la invitación con las secciones que se le pasen.
 *
 * Las banderas son una constante de módulo, así que apagar una solo se comprueba reconstruyendo el
 * módulo: `invitation.ts` valida su propia definición al importarse y lanza si no cuadra, de modo
 * que el propio import es la prueba.
 */
async function invitationWithSections(sections: {menu: boolean; dietary: boolean; bus: boolean; song: boolean}) {
    vi.resetModules()
    vi.doMock('./rsvpSections', () => ({weddingRsvpSections: sections}))
    const module = await import('./invitation')
    return module.weddingInvitation
}

const ALL_ON = {menu: true, dietary: true, bus: true, song: true}

/** Traduce a la propia clave, para que lo que se afirma sea el rotulo elegido y no su traduccion. */
const localization: LocalizationContextValue = {
    locale: 'es',
    supportedLocales: ['es'],
    selectorVisible: false,
    isLoading: false,
    error: null,
    t: key => key,
    setLocale: async () => undefined,
    formatDate: value => String(value),
}

/** Los campos que cada seccion aporta al panel, para poder exigir que se vayan todos juntos. */
const FIELDS_OF_SECTION = {
    menu: ['menuChoice'],
    dietary: ['dietaryOptions', 'dietaryOther'],
    bus: ['busOption'],
    song: ['songRequest'],
} as const

/** Una fila cualquiera: sin respuestas la tabla pinta su estado vacio y no hay cabecera que leer. */
const response = {
    id: 1,
    createdAt: '2026-08-03T10:00:00Z',
    invitationId: 'gala-y-valentin',
    formId: 'wedding-rsvp',
    formVersion: 1,
    locale: 'es',
    answers: {fullName: 'Invitada de Prueba', attending: true},
}

describe('weddingInvitation sections', () => {
    beforeEach(() => {
        vi.resetModules()
        vi.doUnmock('./rsvpSections')
    })

    // Una bandera que tumba la invitación al arrancar no es opcional, es una bandera que no existe.
    // `columnLabels` rotulaba `menuChoice` pasara lo que pasara, así que apagar el menú dejaba un
    // rótulo apuntando a un campo que el formulario ya no construye -- y la validación, que existe
    // justamente para que eso no pase en silencio, se llevaba por delante la invitación entera.
    it.each([
        ['menu', {...ALL_ON, menu: false}],
        ['dietary', {...ALL_ON, dietary: false}],
        ['bus', {...ALL_ON, bus: false}],
        ['song', {...ALL_ON, song: false}],
        ['todas las opcionales', {menu: false, dietary: false, bus: false, song: false}],
    ])('builds a valid invitation with %s turned off', async (_case, sections) => {
        // Given a wedding that does not ask for that section
        // When the invitation is built, which validates itself on import
        // Then it builds, and neither the table nor the export names the field that is not asked
        const invitation = await invitationWithSections(sections)
        const admin = invitation.capabilities.admin!
        const asked = new Set(invitation.capabilities.rsvp!.form.steps.flatMap(step => step.elements).map(e => e.id))

        for (const id of admin.columns) expect(asked).toContain(id)
        for (const id of Object.keys(admin.columnLabels ?? {})) expect(asked).toContain(id)
        for (const id of admin.controls?.csvExport?.columns ?? []) expect(asked).toContain(id)
        for (const id of Object.keys(admin.controls?.csvExport?.valueLabels ?? {})) expect(asked).toContain(id)
        for (const id of admin.metrics.breakdownFieldIds ?? []) expect(asked).toContain(id)
        for (const id of admin.metrics.dietaryFieldIds ?? []) expect(asked).toContain(id)
        if (admin.metrics.transportFieldId) expect(asked).toContain(admin.metrics.transportFieldId)
    })

    /*
     * Lo de arriba comprueba que nada **nombre** un campo que no se pregunta. Esto comprueba que
     * nada se **pinte**, que es lo que ve la pareja y lo que recibe el catering.
     *
     * No es la misma afirmacion: la tabla y el fichero se construyen desde esas listas hoy, y una
     * columna escrita a mano en `ResponsesTable` pasaria la primera y fallaria esta.
     */
    it.each([
        ['menu', {...ALL_ON, menu: false}, 'admin.menu'],
        ['dietary', {...ALL_ON, dietary: false}, 'admin.dietary'],
        ['bus', {...ALL_ON, bus: false}, 'admin.bus'],
    ] as const)('draws no column for %s once it is turned off', async (section, sections, retiredLabel) => {
        // Given a wedding that does not ask for that section
        const invitation = await invitationWithSections(sections)
        const admin = invitation.capabilities.admin!
        const form = invitation.capabilities.rsvp!.form

        // When the panel paints its table and builds the file it hands over
        render(
            <LocalizationContext.Provider value={localization}>
                <ResponsesTable responses={[response]} loading={false} hasError={false} errorMessage={null}
                                form={form} columns={admin.columns} columnLabels={admin.columnLabels}
                                onRetry={() => {}} onUpdate={async () => true} onDelete={() => {}}
                                onRestore={() => {}} rowError={null}/>
            </LocalizationContext.Provider>,
        )
        const header = buildResponsesCsv({
            responses: [],
            columns: admin.controls!.csvExport!.columns!,
            columnLabels: admin.columnLabels,
            valueLabels: admin.controls!.csvExport!.valueLabels,
            form,
            translate: (key: string) => key,
            booleanLabels: {yes: 'common.yes', no: 'common.no'},
        }).split('\r\n')[0]

        // Then neither of them carries the retired column, and the guest still has a name
        const headers = within(screen.getAllByRole('row')[0]).getAllByRole('columnheader')
            .map(cell => cell.textContent)
        expect(headers).not.toContain(retiredLabel)
        expect(headers).toContain('admin.guest')
        expect(header).not.toContain(retiredLabel)
        expect(header).toContain('admin.guest')

        // And the question itself is gone from the form, so there is nothing left to draw it from
        const asked = new Set(form.steps.flatMap(step => step.elements).map(element => element.id))
        for (const id of FIELDS_OF_SECTION[section]) expect(asked).not.toContain(id)
    })

    // El bloque de recuento no es una columna que se encoge: es una seccion entera que sobra.
    it('counts no menus once the menu is not asked', async () => {
        // Given a wedding that serves one menu and does not ask which
        const invitation = await invitationWithSections({...ALL_ON, menu: false})
        const admin = invitation.capabilities.admin!

        // When the panel reads what it has to break down
        // Then there is nothing to break down, and no label left pointing at it
        expect(admin.metrics.breakdownFieldIds ?? []).toEqual([])
        expect((admin as {breakdownLabels?: Record<string, string>}).breakdownLabels ?? {}).toEqual({})
    })
})

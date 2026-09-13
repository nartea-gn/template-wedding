// @vitest-environment node
import {beforeEach, describe, expect, it, vi} from 'vitest'
import {weddingRsvpForm} from './rsvpForm'
import {isConditionMet} from '../../core/forms/visibility'
import type {VisibilityCondition} from '../../core/forms'

/**
 * Carga el formulario con las secciones que se le pasen.
 *
 * Las banderas son una constante de modulo, asi que la unica forma de comprobar que apagan algo es
 * reconstruir el modulo con otras: una bandera que no se lee no se distingue de una que se lee y
 * no hace nada, y eso es justo lo que hay que impedir aqui.
 */
async function formWithSections(sections: {menu?: boolean; dietary: boolean; bus: boolean; song: boolean}) {
    vi.resetModules()
    vi.doMock('./rsvpSections', () => ({weddingRsvpSections: {menu: false, ...sections}}))
    const module = await import('./rsvpForm')
    return module.weddingRsvpForm
}

const stepIds = (form: {steps: readonly {id: string}[]}) => form.steps.map(step => step.id)
const fieldIds = (form: {steps: readonly {id: string; elements: readonly {id: string}[]}[]}, stepId: string) =>
    form.steps.find(step => step.id === stepId)?.elements.map(element => element.id)

describe('weddingRsvpForm', () => {
    beforeEach(() => {
        vi.resetModules()
        vi.doUnmock('./rsvpSections')
    })

    it('gathers everything the couple has to organise into one step', () => {
        // Given the wedding as configured
        // When the form is built
        // Then the menu, the allergies and the coach share a step, each under its own label, and
        // the song -- the only question that organises nothing -- keeps its own
        expect(stepIds(weddingRsvpForm)).toEqual(['attendance', 'logistics', 'detail', 'message'])
        expect(fieldIds(weddingRsvpForm, 'logistics')).toEqual([
            'menuSection', 'menuChoice',
            'dietarySection', 'dietaryNotice', 'dietaryOptions', 'dietaryOther',
            'transportSection', 'busOption',
        ])
        expect(fieldIds(weddingRsvpForm, 'detail')).toEqual(['songRequest'])
    })

    // El menu no es dato de salud -- carne o pescado es una preferencia, infantil es una edad --,
    // asi que quedar por encima del aviso no es cosmetico: debajo reclamaria un consentimiento del
    // articulo 9 que no necesita, y diluiria el que las alergias si necesitan.
    it('puts the menu above the health notice, never under it', () => {
        // Given the logistics step
        const ids = fieldIds(weddingRsvpForm, 'logistics')!

        // When the menu and the notice are located
        // Then the menu comes first
        expect(ids.indexOf('menuChoice')).toBeLessThan(ids.indexOf('dietaryNotice'))
    })

    it('drops the allergies, the notice and their label when the wedding does not ask', async () => {
        // Given a wedding that asks no dietary question
        const form = await formWithSections({menu: true, dietary: false, bus: true, song: true})

        // When the form is built
        // Then neither the question, nor the article 9 notice that justifies it, nor its label
        // are left behind
        expect(fieldIds(form, 'logistics')).toEqual([
            'menuSection', 'menuChoice', 'transportSection', 'busOption',
        ])
        expect(JSON.stringify(form)).not.toContain('rsvp.dietary.notice')
        expect(JSON.stringify(form)).not.toContain('rsvp.section.dietary')
    })

    it('takes each label away with the block it names', async () => {
        // Given a wedding with no menu and no coach
        const form = await formWithSections({menu: false, dietary: true, bus: false, song: true})

        // When the form is built
        // Then no label is left heading nothing
        expect(fieldIds(form, 'logistics')).toEqual([
            'dietarySection', 'dietaryNotice', 'dietaryOptions', 'dietaryOther',
        ])
    })

    // Rotular una lista de uno es peor que no rotularla: el titulo del paso ya dice lo que hay.
    it('does not label the transport when the transport is all there is', async () => {
        // Given a wedding whose only logistics question is the coach
        const form = await formWithSections({menu: false, dietary: false, bus: true, song: true})

        // When the form is built
        // Then the coach stands alone, with no label above it
        expect(fieldIds(form, 'logistics')).toEqual(['busOption'])
    })

    // Un paso con titulo, barra de progreso y boton de siguiente que no pregunta nada es peor que
    // no tenerlo: el invitado cuenta un paso mas y no encuentra nada que hacer en el.
    it('leaves no empty step behind when a whole step is switched off', async () => {
        // Given a wedding that asks none of the logistics questions and no song
        const form = await formWithSections({menu: false, dietary: false, bus: false, song: false})

        // When the form is built
        // Then both steps are gone rather than rendered empty
        expect(stepIds(form)).toEqual(['attendance', 'message'])
    })

    it('offers the dedication to the guest who declines, and to no other', () => {
        // Given the wedding form
        // When the dedication step is read
        const message = weddingRsvpForm.steps.find(step => step.id === 'message') as {visibleWhen?: VisibilityCondition} | undefined

        // Then it is shown only to whoever answered that they cannot come: a guest who confirms
        // has already walked the allergies and the details, and asking them to write by hand
        // right above the submit button put the costliest step where the form is most abandoned.
        expect(message?.visibleWhen).toEqual({fieldId: 'attending', equals: false})
    })

    it('asks the guest who confirms for nothing that needs writing after the details', () => {
        // Given a guest who has answered that they are coming
        const answers = {attending: true}

        // When the steps they walk are resolved with the engine's own rule
        const walked = weddingRsvpForm.steps
            .filter(step => isConditionMet((step as {visibleWhen?: VisibilityCondition}).visibleWhen, answers))
            .map(step => step.id)

        // Then the dedication is not among them and the details close the form
        expect(walked).toEqual(['attendance', 'logistics', 'detail'])
    })
})

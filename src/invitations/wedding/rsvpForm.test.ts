// @vitest-environment node
import {beforeEach, describe, expect, it, vi} from 'vitest'
import {weddingRsvpForm} from './rsvpForm'

/**
 * Carga el formulario con las secciones que se le pasen.
 *
 * Las banderas son una constante de modulo, asi que la unica forma de comprobar que apagan algo es
 * reconstruir el modulo con otras: una bandera que no se lee no se distingue de una que se lee y
 * no hace nada, y eso es justo lo que hay que impedir aqui.
 */
async function formWithSections(sections: {dietary: boolean; bus: boolean; song: boolean}) {
    vi.resetModules()
    vi.doMock('./rsvpSections', () => ({weddingRsvpSections: sections}))
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

    it('asks the allergies apart from the logistics', () => {
        expect(stepIds(weddingRsvpForm)).toEqual(['attendance', 'dietary', 'extras', 'message'])
        expect(fieldIds(weddingRsvpForm, 'dietary')).toEqual([
            'dietaryNotice', 'dietaryOptions', 'dietaryOther',
        ])
        expect(fieldIds(weddingRsvpForm, 'extras')).toEqual(['busOption', 'songRequest'])
    })

    it('drops the allergies step, its notice included, when the wedding does not ask', async () => {
        const form = await formWithSections({dietary: false, bus: true, song: true})

        expect(stepIds(form)).toEqual(['attendance', 'extras', 'message'])
        // El aviso del articulo 9 se va con la pregunta que lo justifica, no antes ni despues.
        expect(JSON.stringify(form)).not.toContain('rsvp.dietary.notice')
    })

    it('keeps the step for whichever of the two logistics questions survives', async () => {
        const withoutBus = await formWithSections({dietary: true, bus: false, song: true})
        expect(fieldIds(withoutBus, 'extras')).toEqual(['songRequest'])

        const withoutSong = await formWithSections({dietary: true, bus: true, song: false})
        expect(fieldIds(withoutSong, 'extras')).toEqual(['busOption'])
    })

    // Un paso con titulo, barra de progreso y boton de siguiente que no pregunta nada es peor que
    // no tenerlo: el invitado cuenta un paso mas y no encuentra nada que hacer en el.
    it('leaves no empty step behind when both logistics questions are off', async () => {
        const form = await formWithSections({dietary: true, bus: false, song: false})

        expect(stepIds(form)).toEqual(['attendance', 'dietary', 'message'])
    })

    it('keeps the two steps a guest always walks through', async () => {
        const form = await formWithSections({dietary: false, bus: false, song: false})

        expect(stepIds(form)).toEqual(['attendance', 'message'])
    })
})

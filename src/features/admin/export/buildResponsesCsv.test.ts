// @vitest-environment node
import {describe, expect, it} from 'vitest'
import type {RsvpSubmissionRecord} from '../../rsvp/domain/RsvpSubmission'
import {weddingRsvpForm} from '../../../invitations/wedding/rsvpForm'
import {buildResponsesCsv} from './buildResponsesCsv'

const response: RsvpSubmissionRecord = {
    id: 1,
    createdAt: '2026-08-03T10:00:00Z',
    invitationId: 'gala-y-valentin',
    formId: 'wedding-rsvp',
    formVersion: 4,
    locale: 'es',
    answers: {fullName: 'Ana López', attending: true},
}

const csv = (responses: readonly RsvpSubmissionRecord[]) => buildResponsesCsv({
    responses,
    columns: ['fullName', 'attending'],
    form: weddingRsvpForm,
    translate: (key: string) => key,
    booleanLabels: {yes: 'common.yes', no: 'common.no'},
})

describe('buildResponsesCsv', () => {
    // Las etiquetas de las opciones estan escritas para quien responde. Quien recibe el fichero no
    // respondio nada: ordena, filtra y cuenta.
    it('writes the declared label of an option instead of the sentence the guest read', () => {
        const rows = buildResponsesCsv({
            responses: [{...response, answers: {fullName: 'Ana López', attending: true, busOption: 'no'}}],
            columns: ['busOption'],
            valueLabels: {busOption: {no: 'admin.export.bus.no'}},
            form: weddingRsvpForm,
            translate: (key: string) => key,
            booleanLabels: {yes: 'common.yes', no: 'common.no'},
        }).split('\r\n')

        expect(rows[1]).toBe('"admin.export.bus.no"')
        expect(rows[1]).not.toContain('rsvp.bus.no')
    })

    // La raya dice "aqui no hay nada" en una tabla y estorba en una hoja de calculo, donde la celda
    // vacia ya lo dice y ademas se filtra.
    it('leaves an unanswered cell empty rather than drawing a dash into the spreadsheet', () => {
        const rows = buildResponsesCsv({
            responses: [{...response, answers: {fullName: 'Ana López', attending: true}}],
            columns: ['fullName', 'songRequest'],
            form: weddingRsvpForm,
            translate: (key: string) => key,
            booleanLabels: {yes: 'common.yes', no: 'common.no'},
        }).split('\r\n')

        expect(rows[1]).toBe('"Ana López",""')
    })

    // La tabla del panel ya rotulaba con el sustantivo declarado y el fichero no, asi que quien
    // recibia el CSV leia la pregunta que se le hizo al invitado encima de sus respuestas.
    it('heads each column with the declared label instead of the form question', () => {
        const header = buildResponsesCsv({
            responses: [response],
            columns: ['fullName', 'attending'],
            columnLabels: {fullName: 'admin.guest'},
            form: weddingRsvpForm,
            translate: (key: string) => key,
            booleanLabels: {yes: 'common.yes', no: 'common.no'},
        }).split('\r\n')[0]

        // El declarado manda; el que no se declara sigue cayendo a la etiqueta del formulario.
        expect(header).toContain('"admin.guest"')
        expect(header).toContain('"rsvp.attending.label"')
    })

    // El aviso del propio panel dice que este fichero se entrega al catering. Dos invitados que
    // escribieron el mismo nombre son dos lineas identicas si la marca se queda en la pantalla.
    it('carries the mark that tells two guests with one name apart', () => {
        const lines = csv([response, {...response, id: 2, namesakeMark: 2}]).split('\r\n')

        expect(lines[1]).toContain('"Ana López"')
        expect(lines[2]).toContain('"Ana López (2)"')
    })

    it('leaves the first holder of a name as they typed it', () => {
        expect(csv([response]).split('\r\n')[1]).toContain('"Ana López"')
    })
})

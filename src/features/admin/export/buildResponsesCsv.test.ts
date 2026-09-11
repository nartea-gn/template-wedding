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

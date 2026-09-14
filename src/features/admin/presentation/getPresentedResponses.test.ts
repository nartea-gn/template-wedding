// @vitest-environment node
import {describe, expect, it} from 'vitest'
import {getPresentedResponses, isLive, needsDiet, needsTransport} from './getPresentedResponses'
import type {RsvpSubmissionRecord} from '../../rsvp/domain/RsvpSubmission'

const metrics = {
    attendanceFieldId: 'attending',
    transportFieldId: 'busOption',
    ownTransportValue: 'no',
    dietaryFieldIds: ['dietaryOptions', 'dietaryOther'],
}

function record(id: number, answers: Record<string, unknown>, deletedAt?: string): RsvpSubmissionRecord {
    return {
        id,
        createdAt: `2026-08-0${id}T10:00:00Z`,
        deletedAt,
        invitationId: 'gala-y-valentin',
        formId: 'wedding-rsvp',
        formVersion: 3,
        locale: 'es',
        answers,
    } as unknown as RsvpSubmissionRecord
}

const responses = [
    record(1, {fullName: 'Ana', attending: true, busOption: 'ida_vuelta', dietaryOptions: ['gluten']}),
    record(2, {fullName: 'Bruno', attending: false, dietaryOptions: ['lactose']}),
    record(3, {fullName: 'Carla', attending: true, busOption: 'no', dietaryOptions: ['none']}),
    record(4, {fullName: 'Dario', attending: true, busOption: 'solo_ida'}, '2026-08-09T10:00:00Z'),
]

function present(filter: Parameters<typeof getPresentedResponses>[0]['filter']) {
    return getPresentedResponses({
        responses, filter, query: '', sortOrder: 'oldest',
        identityFieldId: 'fullName', metrics, locale: 'es',
    }).map(response => response.answers.fullName)
}

describe('getPresentedResponses', () => {
    // La regresion: una fila eliminada seguia contando en las cifras, en el recuento de
    // resultados y en el CSV que el panel manda dar al catering.
    it('keeps deleted responses out of every view except their own', () => {
        expect(present('all')).toEqual(['Ana', 'Bruno', 'Carla'])
        expect(present('confirmed')).toEqual(['Ana', 'Carla'])
        expect(present('declined')).toEqual(['Bruno'])
        expect(present('bus')).toEqual(['Ana'])
    })

    // "Quien necesita sin gluten" era la pregunta que el panel no podia responder: obligaba a
    // recorrer seis paginas a mano.
    it('filters the guests who need something from the caterer', () => {
        expect(present('dietary')).toEqual(['Ana'])
    })

    it('does not count the exclusive none option, nor a guest who is not coming', () => {
        expect(needsDiet(responses[0], metrics)).toBe(true)
        expect(needsDiet(responses[2], metrics)).toBe(false)
        expect(needsDiet(responses[1], metrics)).toBe(false)
    })

    it('shows only the deleted responses under the deleted filter, so they can be restored', () => {
        expect(present('deleted')).toEqual(['Dario'])
    })

    it('reads a response as live only while it carries no deletion stamp', () => {
        expect(isLive(responses[0])).toBe(true)
        expect(isLive(responses[3])).toBe(false)
    })

    // `ownTransportValue` es 'no': quien lo elige no necesita autobus, y un token que no sea
    // ninguno de los declarados tampoco debe contarse como que si.
    it('counts a coach seat only for a recognised choice that is not the own-transport one', () => {
        expect(needsTransport(responses[0], metrics)).toBe(true)
        expect(needsTransport(responses[2], metrics)).toBe(false)
        expect(needsTransport(responses[1], metrics)).toBe(false)
    })
})

// @vitest-environment node
import {describe, expect, it} from 'vitest'
import {parseChoiceFilter, tallyField} from './getPresentedResponses'
import type {RsvpSubmissionRecord} from '../../rsvp/domain/RsvpSubmission'

const metrics = {attendanceFieldId: 'attending'}

function response(answers: Record<string, unknown>, deletedAt: string | null = null) {
    return {id: String(Math.abs(JSON.stringify(answers).length)), answers, deletedAt} as unknown as RsvpSubmissionRecord
}

describe('tallyField', () => {
    it('counts how many attending guests picked each value', () => {
        // Given four guests who are coming and have picked a menu
        const responses = [
            response({attending: true, menuChoice: 'meat'}),
            response({attending: true, menuChoice: 'fish'}),
            response({attending: true, menuChoice: 'meat'}),
            response({attending: true, menuChoice: 'vegan'}),
        ]

        // When the menu is tallied
        const tally = tallyField(responses, 'menuChoice', metrics)

        // Then each value carries its own count
        expect(tally).toEqual({meat: 2, fish: 1, vegan: 1})
    })

    // El menu de quien declina no se cocina. Contarlo daria al catering un numero mayor que el de
    // comensales, que es exactamente el error que este bloque viene a evitar.
    it('leaves out the guests who are not coming', () => {
        // Given a guest who declines but whose menu answer survived in the record
        const responses = [
            response({attending: true, menuChoice: 'meat'}),
            response({attending: false, menuChoice: 'fish'}),
        ]

        // When the menu is tallied
        const tally = tallyField(responses, 'menuChoice', metrics)

        // Then only the guest who is coming counts
        expect(tally).toEqual({meat: 1})
    })

    // Una fila borrada sigue en el array para poder restaurarla, y ya se colo una vez en los
    // contadores de cabecera: el panel decia 60 respuestas donde la base tenia 58.
    it('leaves out the rows the couple deleted', () => {
        // Given one live response and one soft-deleted
        const responses = [
            response({attending: true, menuChoice: 'meat'}),
            response({attending: true, menuChoice: 'meat'}, '2026-09-01T00:00:00Z'),
        ]

        // When the menu is tallied
        const tally = tallyField(responses, 'menuChoice', metrics)

        // Then the deleted one does not add a plate
        expect(tally).toEqual({meat: 1})
    })

    it('ignores an answer that is missing or blank instead of counting it as a value', () => {
        // Given guests who are coming with no menu answer at all
        const responses = [
            response({attending: true, menuChoice: 'meat'}),
            response({attending: true, menuChoice: ''}),
            response({attending: true}),
        ]

        // When the menu is tallied
        const tally = tallyField(responses, 'menuChoice', metrics)

        // Then the blanks form no category of their own: the gap is read against the attending
        // total, which the headline cards already state right above
        expect(tally).toEqual({meat: 1})
    })
})

describe('parseChoiceFilter', () => {
    it('reads the field and the value out of a choice filter', () => {
        // Given a filter for one menu option
        // When it is parsed
        // Then the field and the value come back apart, and a value with colons survives
        expect(parseChoiceFilter('choice:menuChoice:fish')).toEqual({fieldId: 'menuChoice', value: 'fish'})
        expect(parseChoiceFilter('choice:menuChoice:a:b')).toEqual({fieldId: 'menuChoice', value: 'a:b'})
    })

    it('says no to everything that is not one', () => {
        // Given the fixed views and a malformed filter
        // When they are parsed
        // Then none of them claims to be a choice
        expect(parseChoiceFilter('all')).toBeNull()
        expect(parseChoiceFilter('dietary')).toBeNull()
        expect(parseChoiceFilter('choice:' as never)).toBeNull()
        expect(parseChoiceFilter('choice::fish' as never)).toBeNull()
    })
})

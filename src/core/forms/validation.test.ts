import {describe, expect, it} from 'vitest'
import {weddingRsvpForm} from '../../invitations/wedding/rsvpForm'
import {validateElements, validateFormDefinition} from './validation'
import {isConditionMet} from './visibility'

describe('form validation', () => {
    it('accepts the canonical RSVP form definition', () => {
        expect(validateFormDefinition(weddingRsvpForm)).toEqual([])
    })

    it('requires identity and attendance on the first step', () => {
        const errors = validateElements(weddingRsvpForm.steps[0].elements, {
            fullName: '',
            attending: null,
        })

        expect(errors).toEqual({fullName: 'required', attending: 'required'})
    })

    it('validates the minimum number of words for the identity', () => {
        const errors = validateElements(weddingRsvpForm.steps[0].elements, {
            fullName: 'Gala',
            attending: true,
        })

        expect(errors.fullName).toBe('minWords')
    })

    it('evaluates conditional steps from the current answers', () => {
        const condition = weddingRsvpForm.steps[1].visibleWhen

        expect(isConditionMet(condition, {attending: true})).toBe(true)
        expect(isConditionMet(condition, {attending: false})).toBe(false)
    })

    it('rejects invalid field limits in a form definition', () => {
        const firstStep = weddingRsvpForm.steps[0]
        const firstElement = firstStep.elements[0]
        const definition = {
            ...weddingRsvpForm,
            steps: [{
                ...firstStep,
                elements: [{...firstElement, validation: {minLength: 20, maxLength: 10}}],
            }],
        }

        expect(validateFormDefinition(definition)).toContain(
            'Element fullName minLength cannot exceed maxLength',
        )
    })

    it('rejects responses that exceed their configured length', () => {
        const errors = validateElements(weddingRsvpForm.steps[0].elements, {
            fullName: 'A '.repeat(61).trim(),
            attending: true,
        })

        expect(errors.fullName).toBe('maxLength')
    })
})

import {isConditionMet} from './visibility'
import type {FormAnswers, FormDefinition, FormElement, FormErrors, FormValue} from './types'

export function validateFormDefinition<Message extends string>(definition: FormDefinition<Message>): string[] {
    const errors: string[] = []
    const elements = definition.steps.flatMap(step => step.elements)
    const ids = elements.map(element => element.id)
    if (new Set(ids).size !== ids.length) errors.push('Form element ids must be unique')
    if (definition.steps.length === 0) errors.push('A form requires at least one step')
    const idSet = new Set(ids)
    if (!idSet.has(definition.submission.identityFieldId)) errors.push('identityFieldId must reference a field')
    if (definition.submission.attendanceFieldId && !idSet.has(definition.submission.attendanceFieldId)) errors.push('attendanceFieldId must reference a field')
    for (const step of definition.steps) {
        if (step.elements.length === 0) errors.push(`Step ${step.id} requires an element`)
        if (step.visibleWhen && !idSet.has(step.visibleWhen.fieldId)) errors.push(`Step ${step.id} references an unknown field`)
    }
    for (const element of elements) {
        if (element.visibleWhen && !idSet.has(element.visibleWhen.fieldId)) errors.push(`Element ${element.id} references an unknown field`)
        if ('options' in element && new Set(element.options.map(option => String(option.value))).size !== element.options.length) errors.push(`Element ${element.id} has duplicate option values`)
    }
    return errors
}

function isEmpty(value: FormValue | undefined): boolean {
    return value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0)
}

export function validateElements<Message extends string>(elements: readonly FormElement<Message>[], answers: FormAnswers): FormErrors {
    const errors: FormErrors = {}
    for (const element of elements) {
        if (element.type === 'info' || !isConditionMet(element.visibleWhen, answers)) continue
        const value = answers[element.id]
        if (element.required && isEmpty(value)) {
            errors[element.id] = 'required';
            continue
        }
        if (isEmpty(value) || Array.isArray(value) || typeof value !== 'string') continue
        if (element.validation?.minLength && value.length < element.validation.minLength) errors[element.id] = 'minLength'
        if (element.validation?.maxLength && value.length > element.validation.maxLength) errors[element.id] = 'maxLength'
        if (element.type === 'email' && !/^\S+@\S+\.\S+$/.test(value)) errors[element.id] = 'email'
    }
    return errors
}

import {isConditionMet} from './visibility'
import type {FormAnswers, FormDefinition, FormElement, FormErrors, FormValue} from './types'

const FORM_ID_PATTERN = /^[A-Za-z][A-Za-z0-9_-]*$/

export function validateFormDefinition<Message extends string>(definition: FormDefinition<Message>): string[] {
    const errors: string[] = []
    if (!FORM_ID_PATTERN.test(definition.id)) errors.push('Form id must be a stable identifier')
    if (!Number.isInteger(definition.version) || definition.version < 1) {
        errors.push('Form version must be a positive integer')
    }
    const stepIds = definition.steps.map(step => step.id)
    if (new Set(stepIds).size !== stepIds.length) errors.push('Form step ids must be unique')
    if (stepIds.some(id => !FORM_ID_PATTERN.test(id))) errors.push('Form step ids must be stable identifiers')
    const elements = definition.steps.flatMap(step => step.elements)
    const ids = elements.map(element => element.id)
    if (new Set(ids).size !== ids.length) errors.push('Form element ids must be unique')
    if (ids.some(id => !FORM_ID_PATTERN.test(id))) errors.push('Form element ids must be stable identifiers')
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
        if (element.type === 'info' || !element.validation) continue
        const {minLength, maxLength, minWords} = element.validation
        if (minLength !== undefined && (!Number.isInteger(minLength) || minLength < 1)) {
            errors.push(`Element ${element.id} minLength must be a positive integer`)
        }
        if (maxLength !== undefined && (!Number.isInteger(maxLength) || maxLength < 1)) {
            errors.push(`Element ${element.id} maxLength must be a positive integer`)
        }
        if (minWords !== undefined && (!Number.isInteger(minWords) || minWords < 1)) {
            errors.push(`Element ${element.id} minWords must be a positive integer`)
        }
        if (minLength !== undefined && maxLength !== undefined && minLength > maxLength) {
            errors.push(`Element ${element.id} minLength cannot exceed maxLength`)
        }
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
        if (element.validation?.minWords && value.trim().split(/\s+/).filter(Boolean).length < element.validation.minWords) {
            errors[element.id] = 'minWords'
            continue
        }
        if (element.validation?.minLength && value.length < element.validation.minLength) {
            errors[element.id] = 'minLength'
            continue
        }
        if (element.validation?.maxLength && value.length > element.validation.maxLength) {
            errors[element.id] = 'maxLength'
            continue
        }
        if (element.type === 'email' && !/^\S+@\S+\.\S+$/.test(value)) errors[element.id] = 'email'
    }
    return errors
}

import type {FormDefinition, FormElement, FormValue} from '../../../core/forms'

export type Translate<Message extends string> = (key: Message) => string

export function getFormFields<Message extends string>(form: FormDefinition<Message>) {
    return new Map(form.steps.flatMap(step => step.elements).map(field => [field.id, field]))
}

export function formatResponseValue<Message extends string>(
    value: FormValue | undefined,
    field: FormElement<Message> | undefined,
    translate: Translate<Message>,
    booleanLabels: { yes: Message; no: Message },
) {
    if (value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0)) return '—'
    if (typeof value === 'boolean') {
        return translate(value ? booleanLabels.yes : booleanLabels.no)
    }
    const options = field && 'options' in field ? field.options : []
    const labelFor = (item: string) => {
        const option = options.find(candidate => String(candidate.value) === item)
        return option ? translate(option.label) : item
    }
    return Array.isArray(value) ? value.map(labelFor).join(', ') : labelFor(String(value))
}

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

/**
 * The guest's name as the couple has to read it when two of them share one.
 *
 * Appended rather than stored: `answers.fullName` is what the guest typed, and both of them typed
 * the same thing. The mark is the database's, and it is the only thing that tells the two rows
 * apart in a table, in the edit modal's heading and in the CSV handed to the caterer.
 */
export function withNamesakeMark(value: string, mark: number | undefined) {
    return mark ? `${value} (${mark})` : value
}

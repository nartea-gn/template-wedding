import type {FormDefinition, FormElement, FormValue} from '../../../core/forms'

export type Translate<Message extends string> = (key: Message) => string

export function getFormFields<Message extends string>(form: FormDefinition<Message>) {
    return new Map(form.steps.flatMap(step => step.elements).map(field => [field.id, field]))
}

/**
 * Como se rotula un valor cuando no se lee en la pantalla que hizo la pregunta.
 *
 * `valueLabels`: el rotulo de una opcion concreta, por valor. Las etiquetas del formulario estan
 * escritas para el invitado que responde -- "No, ire en mi propio transporte" -- y en una lista que
 * se ordena y se filtra sobran seis palabras de siete.
 *
 * `empty`: que se escribe donde no hay respuesta. La raya es legible en una tabla y es un dato
 * inventado en una hoja de calculo, donde la celda vacia ya significa eso y encima se filtra.
 */
type ValuePresentation = {
    valueLabels?: Readonly<Record<string, string>>
    empty?: string
}

export function formatResponseValue<Message extends string>(
    value: FormValue | undefined,
    field: FormElement<Message> | undefined,
    translate: Translate<Message>,
    booleanLabels: { yes: Message; no: Message },
    presentation: ValuePresentation = {},
) {
    const {valueLabels, empty = '—'} = presentation
    if (value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0)) return empty
    if (typeof value === 'boolean') {
        return translate(value ? booleanLabels.yes : booleanLabels.no)
    }
    const options = field && 'options' in field ? field.options : []
    const labelFor = (item: string) => {
        const declared = valueLabels?.[item]
        if (declared) return translate(declared as Message)
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

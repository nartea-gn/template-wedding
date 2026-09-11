import type {FormDefinition} from '../../../core/forms'
import type {RsvpSubmissionRecord} from '../../rsvp/domain/RsvpSubmission'
import {formatResponseValue, getFormFields, withNamesakeMark, type Translate} from '../presentation/responsePresentation'

type Arguments<Message extends string> = {
    responses: readonly RsvpSubmissionRecord[]
    columns: readonly string[]
    form: FormDefinition<Message>
    translate: Translate<Message>
    booleanLabels: { yes: Message; no: Message }
}

function protectSpreadsheetCell(value: string) {
    return /^[\t\r ]*[=+\-@]/.test(value) ? `'${value}` : value
}

function escapeCsvCell(value: string) {
    return `"${protectSpreadsheetCell(value).replaceAll('"', '""')}"`
}

export function buildResponsesCsv<Message extends string>({
                                                              responses,
                                                              columns,
                                                              form,
                                                              translate,
                                                              booleanLabels,
                                                          }: Arguments<Message>) {
    const fields = getFormFields(form)
    const header = columns.map(id => escapeCsvCell(fields.has(id) ? translate(fields.get(id)!.label) : id))
    const identityFieldId = form.submission.identityFieldId
    const rows = responses.map(response => columns.map(id => {
        const value = formatResponseValue(response.answers[id], fields.get(id), translate, booleanLabels)
        // Dos invitados con el mismo nombre son dos lineas iguales en la lista del catering si la
        // marca se queda solo en la pantalla.
        return escapeCsvCell(id === identityFieldId ? withNamesakeMark(value, response.namesakeMark) : value)
    }))
    return `\uFEFF${[header, ...rows].map(row => row.join(',')).join('\r\n')}`
}

import type {FormDefinition} from '../../../core/forms'
import type {RsvpSubmissionRecord} from '../../rsvp/domain/RsvpSubmission'
import {formatResponseValue, getFormFields, type Translate} from '../presentation/responsePresentation'

type Arguments<Message extends string> = {
    responses: readonly RsvpSubmissionRecord[]
    columns: readonly string[]
    form: FormDefinition<Message>
    translate: Translate<Message>
    booleanLabels: { yes: Message; no: Message }
}

export function buildResponsesJson<Message extends string>({
                                                              responses,
                                                              columns,
                                                              form,
                                                              translate,
                                                              booleanLabels,
                                                          }: Arguments<Message>) {
    const fields = getFormFields(form)
    const payload = responses.map(response => {
        const row: Record<string, unknown> = {id: response.id}
        columns.forEach(id => {
            const field = fields.get(id)
            row[id] = formatResponseValue(response.answers[id], field, translate, booleanLabels)
        })
        return row
    })
    return JSON.stringify({generatedAt: new Date().toISOString(), responses: payload}, null, 2)
}

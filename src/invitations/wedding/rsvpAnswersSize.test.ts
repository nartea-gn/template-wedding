// @vitest-environment node
import {describe, expect, it} from 'vitest'
import {weddingRsvpForm} from './rsvpForm'
import {isDecoration, type FormAnswers, type FormElement, type FormValue} from '../../core/forms'

/**
 * El tope que la base impone a `answers`.
 *
 * `rsvp_responses_answers_check` y la propia política de `INSERT` de `anon` exigen
 * `octet_length((answers)::text) <= 16384`. Pasarse no da un error que un invitado pueda entender:
 * la fila se rechaza y el formulario muestra el fallo generico de envio.
 */
const TOPE_BYTES = 16384

/**
 * El valor mas grande que un campo admite, segun lo que el propio formulario declara.
 *
 * Se deriva de la definicion en vez de escribirse a mano a proposito: una pregunta nueva entra en
 * esta cuenta sin que nadie se acuerde de actualizarla, que es justo el fallo del que esta prueba
 * protege. Sin `maxLength` declarado se asume un limite generoso, porque un campo de texto sin tope
 * es en si mismo el problema.
 */
const SIN_LIMITE = 1000

function valorMaximo<Message extends string>(element: FormElement<Message>): FormValue {
    if (element.type === 'checkbox-group') return element.options.map(option => String(option.value))
    if (element.type === 'radio' || element.type === 'select') {
        const masLargo = element.options
            .map(option => String(option.value))
            .sort((a, b) => b.length - a.length)[0]
        return masLargo ?? ''
    }
    if (element.type === 'number') return Number.MAX_SAFE_INTEGER
    const limite = ('validation' in element ? element.validation?.maxLength : undefined) ?? SIN_LIMITE
    // Una tilde ocupa dos bytes en UTF-8 y `maxLength` cuenta caracteres, no bytes: el peor caso de
    // un campo de 1000 caracteres no son 1000 bytes.
    return 'á'.repeat(limite)
}

/** La respuesta mas pesada que este formulario puede producir. */
function respuestaMaxima(): FormAnswers {
    const answers: FormAnswers = {}
    for (const step of weddingRsvpForm.steps) {
        for (const element of step.elements) {
            if (isDecoration(element)) continue
            answers[element.id] = valorMaximo(element)
        }
    }
    return answers
}

const bytes = (value: unknown) => new TextEncoder().encode(JSON.stringify(value)).length

describe('el tamaño de `answers` contra el tope de la base', () => {
    it('cabe en el peor caso que el propio formulario permite', () => {
        // Given every field filled to the longest value its own validation allows
        const answers = respuestaMaxima()

        // When the payload is measured as the database measures it
        const tamano = bytes(answers)

        // Then it fits, and with room to spare rather than by a hair
        expect(tamano).toBeLessThan(TOPE_BYTES)
    })

    // El margen se documenta para que un cambio que lo coma se vea en el diff de esta prueba y no
    // seis meses despues, en el envio de un invitado que escribio mucho.
    it('deja al menos la mitad del presupuesto libre', () => {
        // Given the heaviest answer this form can produce
        const tamano = bytes(respuestaMaxima())

        // When it is compared against half the cap
        // Then there is still room for roughly as much again: the day this fails, the next
        // question added is the one that has to justify itself
        expect(tamano).toBeLessThan(TOPE_BYTES / 2)
    })

    // Un campo de texto sin `maxLength` no tiene peor caso: lo acota el navegador o nada. Esta
    // prueba existe porque la cuenta de arriba tendria que inventarse un numero para el.
    it('declares a maximum length on every free text field', () => {
        // Given the fields a guest types into freely
        const libres = weddingRsvpForm.steps
            .flatMap(step => step.elements)
            .filter(element => !isDecoration(element))
            .filter(element => element.type === 'text' || element.type === 'textarea')

        // When their validation is read
        const sinTope = libres
            .filter(element => !('validation' in element && element.validation?.maxLength))
            .map(element => element.id)

        // Then every one of them states how long it may get
        expect(sinTope).toEqual([])
        expect(libres.length).toBeGreaterThan(0)
    })
})

import type {FormDefinition, FormElement, FormStep} from '../../core/forms/index.ts'
import type {WeddingMessageKey} from './locales/es.ts'
import {weddingRsvpSections} from './rsvpSections.ts'

type WeddingElement = FormElement<WeddingMessageKey>
type WeddingStep = FormStep<WeddingMessageKey>

const attendanceStep = {
    id: 'attendance',
    title: 'rsvp.step.attendance.title',
    subtitle: 'rsvp.step.attendance.subtitle',
    elements: [
        {
            id: 'fullName',
            type: 'text',
            label: 'rsvp.fullName.label',
            help: 'rsvp.fullName.help',
            placeholder: 'rsvp.fullName.placeholder',
            required: true,
            initialValue: '',
            validation: {minWords: 2, maxLength: 120}
        },
        {
            id: 'attending',
            type: 'radio',
            label: 'rsvp.attending.label',
            required: true,
            requiredMessage: 'rsvp.attending.required',
            initialValue: null,
            // Sin `completesForm`: declinar ya no envia desde el primer paso, porque
            // quien no puede ir sigue teniendo algo que decir y el paso de dedicatoria
            // esta ahora abierto para ambas respuestas.
            options: [{value: true, label: 'rsvp.attending.yes', icon: 'heart'}, {
                value: false,
                label: 'rsvp.attending.no',
                icon: 'heart-broken'
            }]
        },
    ]
} as const satisfies WeddingStep

/**
 * Alergias e intolerancias, solas en su paso.
 *
 * Compartian paso con el autobus, asi que la pregunta que decide si alguien puede comer viajaba
 * junto a una de logistica y se respondia con la misma atencion que ella.
 */
const dietaryStep = {
    id: 'dietary',
    title: 'rsvp.step.dietary.title',
    subtitle: 'rsvp.step.dietary.subtitle',
    visibleWhen: {fieldId: 'attending', equals: true},
    elements: [
        // Se pregunta directamente, sin una puerta previa. El aviso va inmediatamente
        // encima de los campos y el consentimiento del articulo 9 pasa a ser el propio
        // acto de rellenarlos: afirmativo, informado y voluntario. Los campos siguen
        // marcados `sensitive`, asi que no entran en el borrador, y el paso completo
        // sigue condicionado a `attending`, asi que `visibleAnswers` continua
        // eliminandolos del envio de quien acaba diciendo que no puede ir.
        {id: 'dietaryNotice', type: 'info', label: 'rsvp.dietary.notice'},
        {
            id: 'dietaryOptions',
            type: 'checkbox-group',
            label: 'rsvp.dietary.label',
            sensitive: true,
            initialValue: [],
            options: [{value: 'none', label: 'rsvp.dietary.none', exclusive: true}, {
                value: 'gluten',
                label: 'rsvp.dietary.gluten'
            }, {value: 'vegetarian', label: 'rsvp.dietary.vegetarian'}, {
                value: 'lactose',
                label: 'rsvp.dietary.lactose'
            }, {value: 'nuts_seafood', label: 'rsvp.dietary.nutsSeafood'}]
        },
        {
            id: 'dietaryOther',
            type: 'text',
            label: 'rsvp.dietary.other',
            sensitive: true,
            placeholder: 'rsvp.dietary.otherPlaceholder',
            initialValue: '',
            validation: {maxLength: 300}
        },
    ]
} as const satisfies WeddingStep

const busElement = {
    id: 'busOption',
    type: 'select',
    label: 'rsvp.bus.label',
    placeholder: 'rsvp.bus.placeholder',
    initialValue: '',
    options: [{value: 'ida_vuelta', label: 'rsvp.bus.roundTrip'}, {
        value: 'solo_ida',
        label: 'rsvp.bus.outbound'
    }, {value: 'solo_vuelta', label: 'rsvp.bus.return'}, {value: 'no', label: 'rsvp.bus.no'}]
} as const satisfies WeddingElement

const songElement = {
    id: 'songRequest',
    type: 'text',
    label: 'rsvp.song.label',
    placeholder: 'rsvp.song.placeholder',
    initialValue: '',
    validation: {maxLength: 160}
} as const satisfies WeddingElement

/**
 * Autobus y cancion: lo que no decide si alguien puede ir ni que puede comer.
 *
 * El titulo no nombra ninguno de los dos campos a proposito. Cualquiera de ellos puede estar
 * apagado ({@link weddingRsvpSections}), y un titulo que prometiera el autobus encabezando un paso
 * que solo pide una cancion seria una promesa rota en la propia pantalla.
 */
const extrasElements: WeddingElement[] = [
    ...(weddingRsvpSections.bus ? [busElement] : []),
    ...(weddingRsvpSections.song ? [songElement] : []),
]

const extrasStep = {
    id: 'extras',
    title: 'rsvp.step.extras.title',
    subtitle: 'rsvp.step.extras.subtitle',
    visibleWhen: {fieldId: 'attending', equals: true},
    elements: extrasElements,
} as const satisfies WeddingStep

const messageStep = {
    id: 'message',
    title: 'rsvp.step.message.title',
    subtitle: 'rsvp.step.message.subtitle',
    // Sin condicion: es el unico paso que un invitado que declina tambien recorre.
    elements: [{
        id: 'message',
        type: 'textarea',
        label: 'rsvp.message.label',
        placeholder: 'rsvp.message.placeholder',
        initialValue: '',
        validation: {maxLength: 1000}
    }]
} as const satisfies WeddingStep

/**
 * Un paso apagado entero no se pinta vacio: desaparece.
 *
 * `extras` cae cuando sus dos campos estan apagados, porque un paso con titulo, barra de progreso
 * y boton de siguiente que no pregunta nada es peor que no tenerlo.
 *
 * El primer paso se tipa aparte porque no es opcional y nunca deja de ser el primero: asi quien lo
 * lea desde `steps[0]` sigue viendo los campos declarados y no la union ensanchada, que perdia la
 * validacion de `fullName` por el camino.
 */
const steps: readonly [typeof attendanceStep, ...WeddingStep[]] = [
    attendanceStep,
    ...(weddingRsvpSections.dietary ? [dietaryStep] : []),
    ...(extrasElements.length > 0 ? [extrasStep] : []),
    messageStep,
]

export const weddingRsvpForm = {
    // Bump the version whenever the privacy notice or the consent wording changes: the stored
    // version is what proves which text a guest actually consented to.
    id: 'wedding-rsvp', version: 4,
    submission: {identityFieldId: 'fullName', attendanceFieldId: 'attending'},
    privacyNotice: 'rsvp.privacy.notice',
    messages: {
        next: 'rsvp.next',
        back: 'rsvp.back',
        submit: 'rsvp.submit',
        submitting: 'rsvp.submitting',
        submitError: 'rsvp.error.submit',
        // Sin `review`: el resumen de lo respondido se pinta una sola vez, en la pantalla de
        // gracias, que es donde el invitado quiere releerlo. Repetirlo encima del boton de enviar
        // obligaba a leer dos veces lo mismo en dos pantallas seguidas. El motor lo sigue
        // soportando para cualquier formulario que si lo declare.
        errors: {
            required: 'form.error.required',
            email: 'form.error.email',
            minLength: 'form.error.minLength',
            maxLength: 'form.error.maxLength',
            minWords: 'form.error.minWords'
        }
    },
    steps,
} satisfies FormDefinition<WeddingMessageKey>

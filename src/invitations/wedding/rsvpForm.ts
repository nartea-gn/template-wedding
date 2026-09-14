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
            // Sin `completesForm`: declinar no envia desde el primer paso, porque quien
            // no puede ir sigue teniendo algo que decir y la dedicatoria es suya -- es el
            // unico paso que ve, y el unico que no ve quien confirma.
            options: [{value: true, label: 'rsvp.attending.yes', icon: 'heart'}, {
                value: false,
                label: 'rsvp.attending.no',
                icon: 'heart-broken'
            }]
        },
    ]
} as const satisfies WeddingStep

/**
 * Menu, alergias y transporte: un solo paso con rotulos dentro.
 *
 * Cada bloque declara su `section`, asi que apagar una bandera se lleva su rotulo con ella y no
 * deja un encabezado huerfano sobre el vacio. El orden importa por una razon que no es estetica:
 * el aviso del articulo 9 va **despues** del menu y **antes** de las alergias, porque el menu no
 * es dato de salud y quedaria cubierto por un consentimiento que no necesita.
 */
const menuElements: WeddingElement[] = weddingRsvpSections.menu ? [
    {id: 'menuSection', type: 'section', label: 'rsvp.section.banquet', note: 'rsvp.section.banquet.note'},
    {
        id: 'menuChoice',
        type: 'radio',
        label: 'rsvp.menu.label',
        required: true,
        requiredMessage: 'rsvp.menu.required',
        initialValue: null,
        options: [
            {value: 'meat', label: 'rsvp.menu.meat'},
            {value: 'fish', label: 'rsvp.menu.fish'},
            {value: 'vegetarian', label: 'rsvp.menu.vegetarian'},
            {value: 'vegan', label: 'rsvp.menu.vegan'},
            {value: 'child', label: 'rsvp.menu.child'},
        ]
    },
] : []

/**
 * Se pregunta directamente, sin una puerta previa. El aviso va inmediatamente encima de los campos
 * y el consentimiento del articulo 9 pasa a ser el propio acto de rellenarlos: afirmativo,
 * informado y voluntario. Los campos siguen marcados `sensitive`, asi que no entran en el
 * borrador, y el paso completo sigue condicionado a `attending`, asi que `visibleAnswers` continua
 * eliminandolos del envio de quien acaba diciendo que no puede ir.
 *
 * Obligatorio, y por eso el aviso ya no termina en "puedes venir sin contarnoslo": con la casilla
 * exigida dejaria de ser cierto. Quien no tiene ninguna marca `Ninguna`, que es lo que mantiene el
 * consentimiento voluntario -- nadie esta forzado a declarar una condicion de salud, solo a decir
 * que no tiene ninguna.
 *
 * `Ninguna` cierra la lista en vez de abrirla: puesta la primera, era la respuesta que el ojo
 * encontraba antes de haber leido las demas.
 */
const dietaryElements: WeddingElement[] = weddingRsvpSections.dietary ? [
    {id: 'dietarySection', type: 'section', label: 'rsvp.section.dietary'},
    {id: 'dietaryNotice', type: 'info', label: 'rsvp.dietary.notice'},
    {
        id: 'dietaryOptions',
        type: 'checkbox-group',
        label: 'rsvp.dietary.label',
        sensitive: true,
        required: true,
        requiredMessage: 'rsvp.dietary.required',
        initialValue: [],
        // Una alergia por casilla. `Celiaco / intolerante al gluten` y `Alergia a frutos secos o
        // marisco` obligaban a marcar dos cosas para decir una: quien solo es alergico al marisco
        // se declaraba tambien alergico a los frutos secos, y el catering cocinaba para una
        // alergia que nadie tenia. Vegetariano y vegano salen de aqui: son dietas, no alergias, y
        // viven en el menu.
        options: [
            {value: 'gluten', label: 'rsvp.dietary.gluten'},
            {value: 'lactose', label: 'rsvp.dietary.lactose'},
            {value: 'nuts', label: 'rsvp.dietary.nuts'},
            {value: 'seafood', label: 'rsvp.dietary.seafood'},
            {value: 'egg', label: 'rsvp.dietary.egg'},
            {value: 'none', label: 'rsvp.dietary.none', exclusive: true},
        ]
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
] : []

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
 * Todo lo que hay que organizar por el invitado, en un paso.
 *
 * El transporte declara su rotulo solo si acompana a algo: cuando el autobus es lo unico que queda
 * encendido, el paso entero es esa pregunta y encabezarla con `Transporte` seria rotular una lista
 * de uno. Si no queda ninguno de los tres, el paso no se pinta vacio -- desaparece.
 */
const transportElements: WeddingElement[] = weddingRsvpSections.bus ? [
    ...(menuElements.length > 0 || dietaryElements.length > 0
        ? [{id: 'transportSection', type: 'section', label: 'rsvp.section.transport'} as WeddingElement]
        : []),
    busElement,
] : []

const logisticsElements: WeddingElement[] = [...menuElements, ...dietaryElements, ...transportElements]

const logisticsStep = {
    id: 'logistics',
    title: 'rsvp.step.logistics.title',
    subtitle: 'rsvp.step.logistics.subtitle',
    visibleWhen: {fieldId: 'attending', equals: true},
    elements: logisticsElements,
} as const satisfies WeddingStep

/**
 * La cancion, sola.
 *
 * Es lo unico del formulario que no organiza nada: el resto decide cuanta comida se encarga y
 * cuantos asientos se reservan, y esto es un gusto. Por eso tiene su paso y no un rotulo mas
 * dentro del anterior.
 */
const detailStep = {
    id: 'detail',
    title: 'rsvp.step.detail.title',
    subtitle: 'rsvp.step.detail.subtitle',
    visibleWhen: {fieldId: 'attending', equals: true},
    elements: weddingRsvpSections.song ? [songElement] : [],
} as const satisfies WeddingStep

const messageStep = {
    id: 'message',
    title: 'rsvp.step.message.title',
    subtitle: 'rsvp.step.message.subtitle',
    /* Solo para quien declina, y ahi es lo unico que puede decir.
     *
     * Quien confirma ya ha recorrido las alergias y los detalles, y llegaba a una pantalla mas que
     * le pedia escribir a mano justo antes del boton de enviar: el paso que mas cuesta rellenar
     * puesto donde mas se abandona. Quien no puede ir no tiene ninguno de los otros dos, asi que
     * sin este su recorrido serian dos clics y un adios.
     *
     * `equals: false` y no la ausencia de condicion: `isConditionMet` compara con igualdad
     * estricta, asi que con `attending` todavia en `null` el paso queda oculto, que es lo correcto
     * mientras la respuesta no se ha dado. */
    visibleWhen: {fieldId: 'attending', equals: false},
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
 * `logistics` cae cuando menu, alergias y autobus estan los tres apagados, y `detail` cuando lo
 * esta la cancion: un paso con titulo, barra de progreso y boton de siguiente que no pregunta nada
 * es peor que no tenerlo.
 *
 * El primer paso se tipa aparte porque no es opcional y nunca deja de ser el primero: asi quien lo
 * lea desde `steps[0]` sigue viendo los campos declarados y no la union ensanchada, que perdia la
 * validacion de `fullName` por el camino.
 */
const steps: readonly [typeof attendanceStep, ...WeddingStep[]] = [
    attendanceStep,
    ...(logisticsElements.length > 0 ? [logisticsStep] : []),
    ...(weddingRsvpSections.song ? [detailStep] : []),
    messageStep,
]

export const weddingRsvpForm = {
    // Bump the version whenever the privacy notice or the consent wording changes: the stored
    // version is what proves which text a guest actually consented to. v5 is that boundary: the
    // article 9 notice lost its closing sentence when the question became required, and the
    // allergy options were split one per allergen, so a v4 answer and a v5 answer do not mean the
    // same thing even when they read the same.
    id: 'wedding-rsvp', version: 5,
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

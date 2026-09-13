import {render, screen} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {describe, expect, it, vi} from 'vitest'
import {LocalizationContext, type LocalizationContextValue} from '../../app/providers/LocalizationContext'
import {weddingRsvpForm} from '../../invitations/wedding/rsvpForm'
import {FormEngine} from './FormEngine'
import type {FormAnswers} from '../../core/forms'

const localization: LocalizationContextValue = {
    locale: 'es',
    supportedLocales: ['es'],
    selectorVisible: false,
    isLoading: false,
    error: null,
    t: key => key,
    setLocale: async () => undefined,
    formatDate: value => String(value),
}

/**
 * Una definicion que si declara el resumen previo al envio.
 *
 * El formulario de la boda dejo de declararlo: su resumen vive en la pantalla de gracias. El
 * motor sigue pintandolo para quien lo pida, y eso es lo que estas pruebas cubren.
 */
const formWithReview = {
    ...weddingRsvpForm,
    messages: {...weddingRsvpForm.messages, review: 'rsvp.review.title'},
} as const

function renderForm(
    onSubmit: (answers: FormAnswers) => Promise<void>,
    privacyNotice?: string,
    definition: typeof weddingRsvpForm | typeof formWithReview = weddingRsvpForm,
) {
    return render(
        <LocalizationContext.Provider value={localization}>
            <FormEngine
                definition={definition}
                isSubmitting={false}
                hasSubmissionError={false}
                onSubmit={onSubmit}
                privacyNotice={privacyNotice}
            />
        </LocalizationContext.Provider>,
    )
}

/** Advances past every remaining step and submits. */
async function advanceToSubmit(user: ReturnType<typeof userEvent.setup>) {
    let next = screen.queryByRole('button', {name: 'rsvp.next'})
    while (next) {
        await user.click(next)
        next = screen.queryByRole('button', {name: 'rsvp.next'})
    }
    await user.click(screen.getByRole('button', {name: 'rsvp.submit'}))
}

/** Fills in the first step affirmatively and lands on the step that gathers the logistics. */
async function reachLogisticsStep(user: ReturnType<typeof userEvent.setup>) {
    await user.type(screen.getByRole('textbox', {name: 'rsvp.fullName.label'}), 'Gala García')
    await user.click(screen.getByLabelText('rsvp.attending.yes'))
    await user.click(screen.getByRole('button', {name: 'rsvp.next'}))
    await screen.findByRole('heading', {name: 'rsvp.step.logistics.title'})
}

/** Answers the two questions that step requires, so the form can move on. */
async function answerLogistics(user: ReturnType<typeof userEvent.setup>) {
    await user.click(screen.getByLabelText('rsvp.menu.meat'))
    await user.click(screen.getByLabelText('rsvp.dietary.none'))
}

describe('FormEngine', () => {
    it('shows validation errors before advancing', async () => {
        const user = userEvent.setup()
        renderForm(vi.fn())

        await user.click(screen.getByRole('button', {name: 'rsvp.next'}))

        // Uno generico y uno propio: la pregunta de si/no declara su `requiredMessage`, asi que ya
        // no dice "Este campo es obligatorio" sino "Por favor, selecciona una opcion".
        expect(screen.getAllByText('form.error.required')).toHaveLength(1)
        expect(screen.getByText('rsvp.attending.required')).toBeInTheDocument()
        expect(screen.getByRole('textbox', {name: 'rsvp.fullName.label'})).toHaveAttribute('aria-invalid', 'true')
    })

    it('exposes configured text limits to the native control', () => {
        renderForm(vi.fn())

        expect(screen.getByRole('textbox', {name: 'rsvp.fullName.label'})).toHaveAttribute('maxlength', '120')
    })

    it('advances through the affirmative flow', async () => {
        const user = userEvent.setup()
        renderForm(vi.fn())

        await user.type(screen.getByRole('textbox', {name: 'rsvp.fullName.label'}), 'Gala García')
        await user.click(screen.getByLabelText('rsvp.attending.yes'))
        await user.click(screen.getByRole('button', {name: 'rsvp.next'}))

        expect(await screen.findByRole('heading', {name: 'rsvp.step.logistics.title'})).toBeInTheDocument()
    })

    // Declinar ya no envia desde el primer paso: quien no puede ir sigue pasando por la
    // dedicatoria, que es el unico paso abierto a las dos respuestas.
    it('offers the dedication step to a guest who declines, and submits from there', async () => {
        const user = userEvent.setup()
        const onSubmit = vi.fn().mockResolvedValue(undefined)
        renderForm(onSubmit)

        await user.type(screen.getByRole('textbox', {name: 'rsvp.fullName.label'}), 'Valentín García')
        await user.click(screen.getByLabelText('rsvp.attending.no'))
        await user.click(screen.getByRole('button', {name: 'rsvp.next'}))
        await screen.findByRole('heading', {name: 'rsvp.step.message.title'})
        await user.click(screen.getByRole('button', {name: 'rsvp.submit'}))

        expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({
            fullName: 'Valentín García',
            attending: false,
        }))
    })

    // Article 13 asks for the notice at the point of collection: nothing is collected until the
    // final button is pressed, so it goes there and not on every step. The health-data question
    // carries its own notice next to the field that collects it.
    it('renders the privacy notice on the step that sends, and on no other', async () => {
        const user = userEvent.setup()
        renderForm(vi.fn(), 'Aviso del responsable')

        expect(screen.queryByText('Aviso del responsable')).not.toBeInTheDocument()
        await reachLogisticsStep(user)
        expect(screen.queryByText('Aviso del responsable')).not.toBeInTheDocument()

        // Un solo `next`: la dedicatoria salio del recorrido afirmativo, asi que la cancion es el
        // ultimo paso y el aviso baja con el boton de enviar hasta ahi.
        await answerLogistics(user)
        await user.click(screen.getByRole('button', {name: 'rsvp.next'}))
        await screen.findByRole('button', {name: 'rsvp.submit'})

        expect(screen.getByText('Aviso del responsable')).toBeInTheDocument()
    })

    // The regression that made a guest press a final submit on step one: `visibleSteps` counted a
    // step gated on an unanswered field as absent, so the bar read 100% and the button read
    // "submit" until the first question was answered -- then the bar went backwards to 25%.
    it('counts the steps that may still unlock instead of only the visible ones', async () => {
        const user = userEvent.setup()
        renderForm(vi.fn())

        const progressbar = screen.getByRole('progressbar')
        expect(progressbar).toHaveAttribute('aria-valuenow', '1')
        expect(progressbar).toHaveAttribute('aria-valuemax', '4')
        expect(progressbar).toHaveAttribute('aria-valuetext', '1 / 4')
        expect(screen.getByRole('button', {name: 'rsvp.next'})).toBeInTheDocument()
        expect(screen.queryByRole('button', {name: 'rsvp.submit'})).not.toBeInTheDocument()

        await user.click(screen.getByLabelText('rsvp.attending.yes'))

        // Confirmar decide la condicion de la dedicatoria en contra, asi que deja de ser
        // alcanzable y el total baja de cuatro a tres. Sin responder sigue contando: no esta
        // descartada, solo sin decidir, que es lo que esta prueba vino a fijar.
        expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuetext', '1 / 3')
    })

    // Declinar descarta los pasos de banquete y musica, pero no la dedicatoria: quedan dos.
    it('counts only the steps a declining guest still walks', async () => {
        const user = userEvent.setup()
        renderForm(vi.fn())

        await user.click(screen.getByLabelText('rsvp.attending.no'))

        expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuetext', '1 / 2')
        expect(screen.getByRole('button', {name: 'rsvp.next'})).toBeInTheDocument()
    })

    // The draft exists so an interruption on step three does not destroy the work. What it must
    // not carry is article 9 data: `visibleAnswers` already strips the health answers of a guest
    // who revokes consent, and a draft that kept them in localStorage would undo that.
    it('keeps the answers across an interruption without saving the health data', async () => {
        const user = userEvent.setup()
        const {unmount} = renderForm(vi.fn())

        await reachLogisticsStep(user)
        await user.click(screen.getByLabelText('rsvp.dietary.none'))

        const draftKey = `nartea:form-draft:${weddingRsvpForm.id}:v${weddingRsvpForm.version}`
        const draft = JSON.parse(localStorage.getItem(draftKey) ?? '{}')

        expect(draft.fullName).toBe('Gala García')
        expect(draft.attending).toBe(true)
        expect(draft).not.toHaveProperty('dietaryConsent')
        expect(draft).not.toHaveProperty('dietaryOptions')
        expect(draft).not.toHaveProperty('dietaryOther')

        unmount()
        renderForm(vi.fn())

        expect(screen.getByRole('textbox', {name: 'rsvp.fullName.label'})).toHaveValue('Gala García')
    })

    it('discards the draft once the answers have been sent', async () => {
        const user = userEvent.setup()
        renderForm(vi.fn().mockResolvedValue(undefined))

        await user.type(screen.getByRole('textbox', {name: 'rsvp.fullName.label'}), 'Gala García')
        await user.click(screen.getByLabelText('rsvp.attending.no'))
        await user.click(screen.getByRole('button', {name: 'rsvp.next'}))
        await screen.findByRole('heading', {name: 'rsvp.step.message.title'})
        await user.click(screen.getByRole('button', {name: 'rsvp.submit'}))

        const draftKey = `nartea:form-draft:${weddingRsvpForm.id}:v${weddingRsvpForm.version}`
        expect(localStorage.getItem(draftKey)).toBeNull()
    })

    // "Confirmar todo" asked for a commitment to answers given up to three steps earlier with
    // nothing on screen to check them against.
    it('shows what is about to be sent on the step that sends it', async () => {
        const user = userEvent.setup()
        renderForm(vi.fn(), undefined, formWithReview)

        await reachLogisticsStep(user)
        // `Ninguna` y nada mas: el resumen no puede acabar afirmando un dato del artículo 9 que
        // esta prueba no viene a comprobar.
        await answerLogistics(user)
        await user.click(screen.getByRole('button', {name: 'rsvp.next'}))

        const review = screen.getByRole('region', {name: 'rsvp.review.title'})

        expect(review).toBeInTheDocument()
        expect(review).toHaveTextContent('rsvp.fullName.label')
        expect(review).toHaveTextContent('Gala García')
        expect(review).toHaveTextContent('rsvp.attending.yes')
    })

    it('shows the summary to a guest who declines, on the step that sends it', async () => {
        const user = userEvent.setup()
        renderForm(vi.fn(), undefined, formWithReview)

        await user.type(screen.getByRole('textbox', {name: 'rsvp.fullName.label'}), 'Gala García')
        await user.click(screen.getByLabelText('rsvp.attending.no'))
        await user.click(screen.getByRole('button', {name: 'rsvp.next'}))
        await screen.findByRole('heading', {name: 'rsvp.step.message.title'})

        const review = screen.getByRole('region', {name: 'rsvp.review.title'})
        expect(review).toHaveTextContent('rsvp.attending.no')
    })

    // La guarda de `stepCount > 1`: un formulario de un solo paso no repite en un resumen lo que
    // ya esta en pantalla.
    it('keeps the summary off a form that only ever has one step', () => {
        const single = {
            ...formWithReview,
            steps: [formWithReview.steps[0]],
        }
        render(
            <LocalizationContext.Provider value={localization}>
                <FormEngine definition={single} isSubmitting={false} hasSubmissionError={false}
                            onSubmit={vi.fn()}/>
            </LocalizationContext.Provider>,
        )

        expect(screen.queryByRole('region', {name: 'rsvp.review.title'})).not.toBeInTheDocument()
    })

    // El formulario de la boda, que es el que se sirve, no declara `review`: lo que ha respondido
    // se le devuelve una sola vez, ya enviado, en la pantalla de gracias.
    it('keeps the summary out of the wedding form, which shows it once it has been sent', async () => {
        const user = userEvent.setup()
        renderForm(vi.fn())

        await user.type(screen.getByRole('textbox', {name: 'rsvp.fullName.label'}), 'Gala García')
        await user.click(screen.getByLabelText('rsvp.attending.no'))
        await user.click(screen.getByRole('button', {name: 'rsvp.next'}))
        await screen.findByRole('heading', {name: 'rsvp.step.message.title'})

        expect(screen.getByRole('button', {name: 'rsvp.submit'})).toBeInTheDocument()
        expect(screen.queryByRole('region', {name: 'rsvp.review.title'})).not.toBeInTheDocument()
    })

    // Ya no hay una pregunta previa que abrir: los campos estan a la vista y el aviso de que son
    // datos de salud va justo encima, que es lo que hace del acto de rellenarlos un
    // consentimiento informado.
    it('asks for the allergies directly, with the health notice above them', async () => {
        const user = userEvent.setup()
        renderForm(vi.fn())

        await reachLogisticsStep(user)

        expect(screen.getByText('rsvp.dietary.notice')).toBeInTheDocument()
        expect(screen.getByText('rsvp.dietary.label')).toBeInTheDocument()
        expect(screen.getByLabelText('rsvp.dietary.gluten')).toBeInTheDocument()
        // El menu comparte pantalla pero no consentimiento: queda por encima del aviso, porque
        // elegir carne o pescado no es declarar un dato de salud.
        const aviso = screen.getByText('rsvp.dietary.notice')
        const menu = screen.getByLabelText('rsvp.menu.meat')
        expect(menu.compareDocumentPosition(aviso)).toBe(Node.DOCUMENT_POSITION_FOLLOWING)
    })

    // La contradiccion viajaba al CSV que la pareja entrega al catering: "Ninguna, como de todo"
    // convivia con una restriccion concreta y nada lo detectaba.
    it('clears the other restrictions when the exclusive one is picked, and the other way round', async () => {
        const user = userEvent.setup()
        renderForm(vi.fn())

        await reachLogisticsStep(user)
        await user.click(screen.getByLabelText('rsvp.dietary.gluten'))
        await user.click(screen.getByLabelText('rsvp.dietary.lactose'))
        expect(screen.getByLabelText('rsvp.dietary.gluten')).toBeChecked()

        await user.click(screen.getByLabelText('rsvp.dietary.none'))
        expect(screen.getByLabelText('rsvp.dietary.none')).toBeChecked()
        expect(screen.getByLabelText('rsvp.dietary.gluten')).not.toBeChecked()
        expect(screen.getByLabelText('rsvp.dietary.lactose')).not.toBeChecked()

        await user.click(screen.getByLabelText('rsvp.dietary.nuts'))
        expect(screen.getByLabelText('rsvp.dietary.nuts')).toBeChecked()
        expect(screen.getByLabelText('rsvp.dietary.none')).not.toBeChecked()
    })

    // El motor usaba el mensaje generico para todo, y el catalogo tenia escrito el especifico.
    it('uses the required message the field declares, not the generic one', async () => {
        const user = userEvent.setup()
        renderForm(vi.fn())

        await user.click(screen.getByRole('button', {name: 'rsvp.next'}))

        expect(screen.getByText('rsvp.attending.required')).toBeInTheDocument()
        expect(screen.getByText('form.error.required')).toBeInTheDocument()
    })

    // Antes se podia pasar de largo, y una respuesta en blanco llegaba al catering como "sin
    // restricciones" sin que nadie lo hubiera dicho. Ahora hay que contestar -- y `Ninguna` es lo
    // que mantiene el consentimiento del articulo 9 voluntario: se exige decir que no hay ninguna,
    // no declarar una condicion de salud.
    it('will not move past the allergies until the guest answers them', async () => {
        // Given a guest on the step that asks for the allergies
        const user = userEvent.setup()
        renderForm(vi.fn())
        await reachLogisticsStep(user)

        // When they try to advance with the menu picked and nothing else
        await user.click(screen.getByLabelText('rsvp.menu.meat'))
        await user.click(screen.getByRole('button', {name: 'rsvp.next'}))

        // Then the step holds, and says what to do if they eat everything
        expect(screen.getByText('rsvp.dietary.required')).toBeInTheDocument()
        expect(screen.getByRole('heading', {name: 'rsvp.step.logistics.title'})).toBeInTheDocument()

        // And ticking the exclusive option is enough to let them through
        await user.click(screen.getByLabelText('rsvp.dietary.none'))
        await user.click(screen.getByRole('button', {name: 'rsvp.next'}))
        expect(await screen.findByRole('heading', {name: 'rsvp.step.detail.title'})).toBeInTheDocument()
    })

    it('will not move past the menu until the guest picks one', async () => {
        // Given a guest on the step that asks for the menu
        const user = userEvent.setup()
        renderForm(vi.fn())
        await reachLogisticsStep(user)

        // When they answer the allergies but not the menu
        await user.click(screen.getByLabelText('rsvp.dietary.none'))
        await user.click(screen.getByRole('button', {name: 'rsvp.next'}))

        // Then the step holds: the caterer needs a count, not a blank
        expect(screen.getByText('rsvp.menu.required')).toBeInTheDocument()
        expect(screen.getByRole('heading', {name: 'rsvp.step.logistics.title'})).toBeInTheDocument()
    })

    // La proteccion del articulo 9 sobrevive al cambio, pero ahora vive en la condicion del paso
    // y no en la de los campos: quien rellena una alergia y despues dice que no puede ir no la
    // envia, porque el paso entero deja de estar visible y `visibleAnswers` lo purga.
    it('drops the dietary answers when the guest ends up declining', async () => {
        const user = userEvent.setup()
        const onSubmit = vi.fn().mockResolvedValue(undefined)
        renderForm(onSubmit)

        await reachLogisticsStep(user)
        await user.click(screen.getByLabelText('rsvp.dietary.gluten'))
        await user.click(screen.getByRole('button', {name: 'rsvp.back'}))
        await user.click(screen.getByLabelText('rsvp.attending.no'))
        await advanceToSubmit(user)

        const answers = onSubmit.mock.calls[0][0]
        expect(answers.attending).toBe(false)
        expect(answers).not.toHaveProperty('dietaryOptions')
        expect(answers).not.toHaveProperty('dietaryOther')
    })
})

export type FormPrimitive = string | number | boolean | null
export type FormValue = FormPrimitive | string[]
export type FormAnswers = Record<string, FormValue>

export type VisibilityCondition = { fieldId: string; equals: FormPrimitive }

export type FormOption<Message extends string> = {
    value: string | boolean
    label: Message
    completesForm?: boolean
    icon?: string
    /**
     * En un grupo de casillas, marcar esta desmarca las demas, y marcar cualquier otra la desmarca
     * a ella.
     *
     * Para las opciones que se contradicen con el resto: "Ninguna, como de todo" se podia marcar
     * junto a "Celiaco / intolerante al gluten", y la contradiccion viajaba al CSV que la pareja
     * entrega al catering. Nada la detectaba, porque el `WITH CHECK` valida forma y no coherencia.
     */
    exclusive?: boolean
}

type ElementBase<Type extends string, Message extends string> = {
    id: string
    type: Type
    label: Message
    help?: Message
    visibleWhen?: VisibilityCondition
}

type FieldBase<Type extends string, Message extends string> = ElementBase<Type, Message> & {
    required?: boolean
    placeholder?: Message
    initialValue?: FormValue
    validation?: { minLength?: number; maxLength?: number; minWords?: number }
    /**
     * Mensaje de "obligatorio" propio de este campo.
     *
     * El motor usaba `messages.errors.required` para todo, asi que una pregunta de si/no decia
     * "Este campo es obligatorio" mientras el catalogo tenia escrito -- y sin usar -- el
     * "Por favor, selecciona una opcion" que corresponde a elegir entre dos opciones.
     */
    requiredMessage?: Message
    /**
     * Excludes the field from the saved draft.
     *
     * For article 9 data. The engine keeps a draft so an interruption does not destroy four steps
     * of work, but health answers must not outlive the tab in `localStorage`: the submission
     * already strips them when the guest revokes consent, and a draft that kept them would undo
     * that on the next visit.
     */
    sensitive?: boolean
}

export type TextField<Message extends string> = FieldBase<'text' | 'email' | 'number' | 'date' | 'textarea', Message>
export type ChoiceField<Message extends string> = FieldBase<'radio' | 'select', Message> & {
    options: readonly FormOption<Message>[]
}
export type CheckboxGroupField<Message extends string> = FieldBase<'checkbox-group', Message> & {
    options: readonly FormOption<Message>[]
}
export type InfoElement<Message extends string> = ElementBase<'info', Message>

export type FormElement<Message extends string> =
    TextField<Message>
    | ChoiceField<Message>
    | CheckboxGroupField<Message>
    | InfoElement<Message>

export type FormStep<Message extends string> = {
    id: string
    title: Message
    subtitle?: Message
    visibleWhen?: VisibilityCondition
    elements: readonly FormElement<Message>[]
}

export type FormDefinition<Message extends string> = {
    id: string
    version: number
    steps: readonly FormStep<Message>[]
    submission: { identityFieldId: string; attendanceFieldId?: string }
    messages: {
        next: Message; back: Message; submit: Message; submitting: Message; submitError: Message
        /** Heading for the summary shown before the final submit. */
        review?: Message
        errors: { required: Message; email: Message; minLength: Message; maxLength: Message; minWords: Message }
    }
    privacyNotice?: Message
}

export type FormErrors = Record<string, 'required' | 'minLength' | 'maxLength' | 'minWords' | 'email'>

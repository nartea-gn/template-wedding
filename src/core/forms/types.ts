export type FormPrimitive = string | number | boolean | null
export type FormValue = FormPrimitive | string[]
export type FormAnswers = Record<string, FormValue>

export type VisibilityCondition = { fieldId: string; equals: FormPrimitive }

export type FormOption<Message extends string> = {
    value: string | boolean
    label: Message
    completesForm?: boolean
    icon?: string
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
        errors: { required: Message; email: Message; minLength: Message; maxLength: Message; minWords: Message }
    }
}

export type FormErrors = Record<string, 'required' | 'minLength' | 'maxLength' | 'minWords' | 'email'>

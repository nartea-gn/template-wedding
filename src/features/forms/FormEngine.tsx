import {type CSSProperties, type FormEvent, useEffect, useRef} from 'react'
import {useLocalization} from '../../app/providers/useLocalization'
import type {FormDefinition, FormElement, FormValue} from '../../core/forms'
import {isConditionMet} from '../../core/forms'
import {useFormEngine} from './useFormEngine'
import {InterfaceIcon} from '../../components/ui/InterfaceIcon'

type Props<Message extends string> = {
    definition: FormDefinition<Message>
    isSubmitting: boolean
    hasSubmissionError: boolean
    onSubmit: (answers: Record<string, FormValue>) => Promise<void>
    /**
     * Overrides `definition.privacyNotice` with text the page has already composed.
     *
     * The article 13 notice has to name the data controller and their contact address, and the
     * localization contract is `t(key)` with no interpolation. Composing it at the page keeps
     * that contract untouched.
     */
    privacyNotice?: string
    /**
     * Level for the step heading.
     *
     * `1` when the form is the whole page, which is the case for `/rsvp`: its only heading was
     * the step's `h2`, so the document outline started at level 2 with no `h1` anywhere.
     */
    headingLevel?: 1 | 2
}

export function FormEngine<Message extends string>({
                                                       definition,
                                                       isSubmitting,
                                                       hasSubmissionError,
                                                       onSubmit,
                                                       privacyNotice,
                                                       headingLevel = 2,
                                                   }: Readonly<Props<Message>>) {
    const {t} = useLocalization<Message>()
    const StepHeading = headingLevel === 1 ? 'h1' : 'h2'
    const engine = useFormEngine(definition)
    const step = engine.currentStep
    const formRef = useRef<HTMLFormElement>(null)
    const headingRef = useRef<HTMLHeadingElement>(null)
    const submissionErrorRef = useRef<HTMLDivElement>(null)
    const previousStepId = useRef<string | undefined>(undefined)

    useEffect(() => {
        if (previousStepId.current && previousStepId.current !== step?.id) headingRef.current?.focus()
        previousStepId.current = step?.id
    }, [step?.id])

    useEffect(() => {
        if (hasSubmissionError) submissionErrorRef.current?.focus()
    }, [hasSubmissionError])

    if (!step) return null

    const submitOrAdvance = async () => {
        if (!engine.validateCurrent()) {
            requestAnimationFrame(() => {
                formRef.current?.querySelector<HTMLElement>(
                    'input[aria-invalid="true"], select[aria-invalid="true"], textarea[aria-invalid="true"]',
                )?.focus()
            })
            return
        }
        if (engine.isLast || engine.completesForm) {
            await onSubmit(engine.visibleAnswers)
            // Only once the answers are gone from here for good.
            engine.clearDraft()
        } else engine.next()
    }

    const handleSubmit = (event: FormEvent) => {
        event.preventDefault();
        void submitOrAdvance()
    }
    const errorMessage = (fieldId: string) => {
        const error = engine.errors[fieldId]
        if (!error) return null
        // El mensaje propio del campo cuando lo declara, y el generico si no.
        const field = definition.steps.flatMap(step => step.elements).find(element => element.id === fieldId)
        if (error === 'required' && field && 'requiredMessage' in field && field.requiredMessage) {
            return t(field.requiredMessage)
        }
        return t(definition.messages.errors[error])
    }
    const errorId = (fieldId: string) => `${definition.id}-${fieldId}-error`
    const helpId = (fieldId: string) => `${definition.id}-${fieldId}-help`
    const describedBy = (element: FormElement<Message>, hasError: boolean) => [
        element.help ? helpId(element.id) : null,
        hasError ? errorId(element.id) : null,
    ].filter(Boolean).join(' ') || undefined
    /**
     * The label plus a visual required marker.
     *
     * `aria-hidden` keeps the asterisk out of the accessible name -- assistive technology is told
     * by `aria-required` instead, and used to hear "asterisk" read as part of the label. The
     * marker is rendered from `element.required`, not typed into the translation strings, where
     * it had already been forgotten on the required dietary consent.
     */
    const renderLabelText = (element: FormElement<Message>) => <>
        {t(element.label)}
        {'required' in element && element.required && (
            <span aria-hidden="true" className="rsvp-required-marker"> *</span>
        )}
    </>
    const requiredAttributes = (element: FormElement<Message>) =>
        'required' in element && element.required ? {'aria-required': true} : {}
    const renderHelp = (element: FormElement<Message>) => element.help
        ? <p id={helpId(element.id)} className="rsvp-help-text">{t(element.help)}</p>
        : null
    const renderError = (fieldId: string, error: string | null) => error
        ? <p id={errorId(fieldId)} className="rsvp-error-text" role="alert">{error}</p>
        : null

    /** An answer as the guest would read it back, resolving option ids to their labels. */
    const readableValue = (element: FormElement<Message>): string => {
        const value = engine.answers[element.id]
        if ('options' in element) {
            if (Array.isArray(value)) {
                return value
                    .map(entry => element.options.find(option => String(option.value) === entry))
                    .map((option, index) => option ? t(option.label) : String(Array.isArray(value) ? value[index] : ''))
                    .join(', ')
            }
            const option = element.options.find(candidate => candidate.value === value)
            return option ? t(option.label) : ''
        }
        return typeof value === 'string' || typeof value === 'number' ? String(value) : ''
    }

    /**
     * What the guest is about to send, on the step that sends it.
     *
     * "Confirmar todo" asked for a commitment to answers given up to three steps earlier, with
     * nothing on screen to check them against, so the guest submitted from memory. Only the
     * fields that are actually visible and actually answered appear -- the same set the
     * submission carries.
     */
    const reviewedFields = definition.steps
        .filter(candidate => isConditionMet(candidate.visibleWhen, engine.answers))
        .flatMap(candidate => candidate.elements)
        .filter(element => element.type !== 'info')
        .filter(element => isConditionMet(element.visibleWhen, engine.answers))
        .map(element => ({element, value: readableValue(element)}))
        .filter(entry => entry.value !== '')

    /**
     * La seleccion resultante de tocar una casilla, respetando las opciones excluyentes.
     *
     * Marcar la excluyente deja solo esa; marcar cualquier otra la quita. Sin esto "Ninguna, como
     * de todo" convivia con "Celiaco" y la contradiccion acababa en el CSV del catering.
     */
    const nextSelection = (element: FormElement<Message>, selected: string[], value: string): string[] => {
        const options = 'options' in element ? element.options : []
        const isExclusive = (candidate: string) =>
            options.some(option => String(option.value) === candidate && option.exclusive === true)

        if (selected.includes(value)) return selected.filter(item => item !== value)
        if (isExclusive(value)) return [value]
        return [...selected.filter(item => !isExclusive(item)), value]
    }

    const renderField = (element: FormElement<Message>) => {
        if (!isConditionMet(element.visibleWhen, engine.answers)) return null
        if (element.type === 'info') return <div key={element.id} className="rsvp-info-box">{t(element.label)}</div>
        const value = engine.answers[element.id]
        const error = errorMessage(element.id)
        const fieldDescription = describedBy(element, Boolean(error))
        const common = {
            id: element.id,
            className: `input ${error ? 'rsvp-input--error' : ''}`,
            'aria-invalid': Boolean(error),
            'aria-describedby': fieldDescription,
            ...requiredAttributes(element),
        }

        if (element.type === 'radio') return (
            <fieldset key={element.id} className={`rsvp-field ${error ? 'rsvp-field--error' : ''}`}
                      aria-invalid={Boolean(error)}
                      aria-describedby={fieldDescription} {...requiredAttributes(element)}>
                <legend className="label">{renderLabelText(element)}</legend>
                {/* The error belongs to the group, not to the options. Tinting every option on an
                    empty submit painted "Sí, ¡allí estaré!" in the error colour -- marking the
                    answer the guest is most likely to want as if it were the mistake. */}
                <div className="rsvp-option-grid">{element.options.map(option => (
                    <label key={String(option.value)}
                           className={`rsvp-option ${value === option.value ? 'rsvp-option--selected' : ''}`}>
                        <input type="radio" name={element.id} value={String(option.value)}
                               checked={value === option.value} aria-invalid={Boolean(error)}
                               aria-describedby={fieldDescription}
                               onChange={() => engine.setValue(element.id, option.value)} className="rsvp-radio"/>
                        <span className="rsvp-option-label">
                            {option.icon && <InterfaceIcon name={option.icon} className="rsvp-option-icon"/>}
                            <span>{t(option.label)}</span>
                        </span>
                    </label>
                ))}</div>
                {renderHelp(element)}
                {renderError(element.id, error)}
            </fieldset>
        )

        if (element.type === 'checkbox-group') {
            const selected = Array.isArray(value) ? value : []
            return <fieldset key={element.id} className="rsvp-field" aria-invalid={Boolean(error)}
                             aria-describedby={fieldDescription} {...requiredAttributes(element)}>
                <legend className="label">{renderLabelText(element)}</legend>
                <div className="rsvp-dietary-list">{element.options.map(option => (
                    <label key={String(option.value)} className="rsvp-checkbox-option"><input type="checkbox"
                                                                                              checked={selected.includes(String(option.value))}
                                                                                              aria-invalid={Boolean(error)}
                                                                                              aria-describedby={fieldDescription}
                                                                                              onChange={() => engine.setValue(element.id, nextSelection(element, selected, String(option.value)))}
                                                                                              className="rsvp-checkbox"/><span
                        className="text-sm">{t(option.label)}</span></label>
                ))}</div>
                {renderHelp(element)}{renderError(element.id, error)}</fieldset>
        }

        if (element.type === 'select') return <div key={element.id} className="rsvp-field"><label className="label"
                                                                                                  htmlFor={element.id}>{renderLabelText(element)}</label><select {...common}
                                                                                                                                                         className={`${common.className} rsvp-select`}
                                                                                                                                                         value={typeof value === 'string' ? value : ''}
                                                                                                                                                         onChange={event => engine.setValue(element.id, event.target.value)}>
            <option value="">{element.placeholder ? t(element.placeholder) : ''}</option>
            {element.options.map(option => <option key={String(option.value)}
                                                   value={String(option.value)}>{t(option.label)}</option>)}
        </select>{renderHelp(element)}{renderError(element.id, error)}</div>

        if (element.type === 'textarea') return <div key={element.id} className="rsvp-field"><label className="label"
                                                                                                    htmlFor={element.id}>{renderLabelText(element)}</label><textarea {...common} className={[common.className, 'rsvp-textarea'].filter(Boolean).join(' ')}
                                                                                                                                                             rows={4}
                                                                                                                                                             minLength={element.validation?.minLength}
                                                                                                                                                             maxLength={element.validation?.maxLength}
                                                                                                                                                             value={typeof value === 'string' ? value : ''}
                                                                                                                                                             placeholder={element.placeholder ? t(element.placeholder) : undefined}
                                                                                                                                                             onChange={event => engine.setValue(element.id, event.target.value)}/>{renderHelp(element)}
            {renderError(element.id, error)}</div>

        return <div key={element.id} className="rsvp-field"><label className="label"
                                                                   htmlFor={element.id}>{renderLabelText(element)}</label><input {...common}
                                                                                                                         type={element.type}
                                                                                                                         minLength={element.validation?.minLength}
                                                                                                                         maxLength={element.validation?.maxLength}
                                                                                                                         value={typeof value === 'string' || typeof value === 'number' ? value : ''}
                                                                                                                         placeholder={element.placeholder ? t(element.placeholder) : undefined}
                                                                                                                         onChange={event => engine.setValue(element.id, element.type === 'number' ? Number(event.target.value) : event.target.value)}/>{renderHelp(element)}
            {renderError(element.id, error)}</div>
    }

    return (
        <div className="card rsvp-card">
            <div className="rsvp-progress-track" role="progressbar" aria-label={t(step.title)}
                 aria-valuemin={1} aria-valuemax={engine.stepCount} aria-valuenow={engine.stepNumber}
                 aria-valuetext={`${engine.stepNumber} / ${engine.stepCount}`}>
                <div className="rsvp-progress-bar"
                     style={{'--progress-ratio': engine.progress / 100} as CSSProperties}/>
            </div>
            {/* Numerals rather than a sentence: `t` takes a key and interpolates nothing, and
                "1 / 4" needs no translation. The bar alone left the guest with no way to know
                how much was left, which is half of why a full bar on step one went unnoticed. */}
            <p className="rsvp-progress-position" aria-hidden="true">
                {engine.stepNumber} / {engine.stepCount}
            </p>
            <form ref={formRef} onSubmit={handleSubmit} className="rsvp-form" noValidate aria-busy={isSubmitting}>
                <div className="rsvp-step">
                    <div className="rsvp-step-header"><StepHeading ref={headingRef} tabIndex={-1}
                                                          className="section-title rsvp-section-title">{t(step.title)}</StepHeading>{step.subtitle &&
                        <p className="section-subtitle">{t(step.subtitle)}</p>}</div>
                    {step.elements.map(renderField)}
                    {hasSubmissionError && <div ref={submissionErrorRef} className="rsvp-error-box" role="alert"
                                                tabIndex={-1}>
                        <p className="rsvp-error-box-text">{t(definition.messages.submitError)}</p>
                    </div>}
                    {/* On the first step only. Repeated on all four, the retention clause was
                        also the last thing a guest read before pressing submit on the step meant
                        to be affectionate. Article 13 asks for it at the point of collection,
                        which is where the form starts; the health-data field carries its own,
                        more specific notice next to the question that collects it. */}
                    {engine.isFirst && (privacyNotice ?? (definition.privacyNotice && t(definition.privacyNotice))) && (
                        <p className="rsvp-privacy-notice">
                            {privacyNotice ?? t(definition.privacyNotice!)}
                        </p>
                    )}
                    {definition.messages.review && engine.isLast && engine.stepCount > 1 && reviewedFields.length > 0 && (
                        <section className="rsvp-review" aria-labelledby={`${definition.id}-review`}>
                            {/* h2 y no h3: el titulo del paso es el h1 de la pagina cuando el
                                formulario ocupa la pantalla, asi que un h3 dejaba un hueco de
                                nivel en el esquema del documento. */}
                            <h2 id={`${definition.id}-review`} className="label">{t(definition.messages.review)}</h2>
                            <dl className="rsvp-review-list">
                                {reviewedFields.map(({element, value}) => (
                                    <div key={element.id} className="rsvp-review-row">
                                        <dt className="rsvp-review-term">{t(element.label)}</dt>
                                        <dd className="rsvp-review-value">{value}</dd>
                                    </div>
                                ))}
                            </dl>
                        </section>
                    )}
                    <div className={engine.isFirst ? 'rsvp-actions-end' : 'rsvp-actions-between'}>
                        {!engine.isFirst && <button type="button" onClick={engine.back}
                                                    className="btn btn--ghost rsvp-btn-ghost">{t(definition.messages.back)}</button>}
                        <button type="submit" disabled={isSubmitting}
                                className="btn btn--primary rsvp-btn-submit">{isSubmitting ? t(definition.messages.submitting) : t(engine.isLast || engine.completesForm ? definition.messages.submit : definition.messages.next)}</button>
                    </div>
                </div>
            </form>
        </div>
    )
}

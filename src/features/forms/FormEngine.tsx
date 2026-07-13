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
}

export function FormEngine<Message extends string>({
                                                       definition,
                                                       isSubmitting,
                                                       hasSubmissionError,
                                                       onSubmit
                                                   }: Readonly<Props<Message>>) {
    const {t} = useLocalization<Message>()
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
        if (engine.isLast || engine.completesForm) await onSubmit(engine.answers)
        else engine.next()
    }

    const handleSubmit = (event: FormEvent) => {
        event.preventDefault();
        void submitOrAdvance()
    }
    const errorMessage = (fieldId: string) => {
        const error = engine.errors[fieldId]
        return error ? t(definition.messages.errors[error]) : null
    }
    const errorId = (fieldId: string) => `${definition.id}-${fieldId}-error`
    const helpId = (fieldId: string) => `${definition.id}-${fieldId}-help`
    const describedBy = (element: FormElement<Message>, hasError: boolean) => [
        element.help ? helpId(element.id) : null,
        hasError ? errorId(element.id) : null,
    ].filter(Boolean).join(' ') || undefined
    const renderHelp = (element: FormElement<Message>) => element.help
        ? <p id={helpId(element.id)} className="rsvp-help-text">{t(element.help)}</p>
        : null
    const renderError = (fieldId: string, error: string | null) => error
        ? <p id={errorId(fieldId)} className="rsvp-error-text" role="alert">{error}</p>
        : null

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
        }

        if (element.type === 'radio') return (
            <fieldset key={element.id} className="rsvp-field" aria-invalid={Boolean(error)}
                      aria-describedby={fieldDescription}>
                <legend className="label">{t(element.label)}</legend>
                <div className="rsvp-option-grid">{element.options.map(option => (
                    <label key={String(option.value)}
                           className={`rsvp-option ${value === option.value ? 'rsvp-option--selected' : error ? 'rsvp-option--error' : ''}`}>
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
                             aria-describedby={fieldDescription}>
                <legend className="label">{t(element.label)}</legend>
                <div className="rsvp-dietary-list">{element.options.map(option => (
                    <label key={String(option.value)} className="rsvp-checkbox-option"><input type="checkbox"
                                                                                              checked={selected.includes(String(option.value))}
                                                                                              aria-invalid={Boolean(error)}
                                                                                              aria-describedby={fieldDescription}
                                                                                              onChange={() => engine.setValue(element.id, selected.includes(String(option.value)) ? selected.filter(item => item !== String(option.value)) : [...selected, String(option.value)])}
                                                                                              className="rsvp-checkbox"/><span
                        className="text-sm">{t(option.label)}</span></label>
                ))}</div>
                {renderHelp(element)}{renderError(element.id, error)}</fieldset>
        }

        if (element.type === 'select') return <div key={element.id} className="rsvp-field"><label className="label"
                                                                                                  htmlFor={element.id}>{t(element.label)}</label><select {...common}
                                                                                                                                                         value={typeof value === 'string' ? value : ''}
                                                                                                                                                         onChange={event => engine.setValue(element.id, event.target.value)}>
            <option value="">{element.placeholder ? t(element.placeholder) : ''}</option>
            {element.options.map(option => <option key={String(option.value)}
                                                   value={String(option.value)}>{t(option.label)}</option>)}
        </select>{renderHelp(element)}{renderError(element.id, error)}</div>

        if (element.type === 'textarea') return <div key={element.id} className="rsvp-field"><label className="label"
                                                                                                    htmlFor={element.id}>{t(element.label)}</label><textarea {...common}
                                                                                                                                                             rows={4}
                                                                                                                                                             value={typeof value === 'string' ? value : ''}
                                                                                                                                                             placeholder={element.placeholder ? t(element.placeholder) : undefined}
                                                                                                                                                             onChange={event => engine.setValue(element.id, event.target.value)}/>{renderHelp(element)}
            {renderError(element.id, error)}</div>

        return <div key={element.id} className="rsvp-field"><label className="label"
                                                                   htmlFor={element.id}>{t(element.label)}</label><input {...common}
                                                                                                                         type={element.type}
                                                                                                                         value={typeof value === 'string' || typeof value === 'number' ? value : ''}
                                                                                                                         placeholder={element.placeholder ? t(element.placeholder) : undefined}
                                                                                                                         onChange={event => engine.setValue(element.id, element.type === 'number' ? Number(event.target.value) : event.target.value)}/>{renderHelp(element)}
            {renderError(element.id, error)}</div>
    }

    return (
        <div className="card rsvp-card">
            <div className="rsvp-progress" role="progressbar" aria-label={t(step.title)} aria-valuemin={0}
                 aria-valuemax={100} aria-valuenow={Math.round(engine.progress)}>
                <div className="rsvp-progress-bar"
                     style={{'--progress': `${engine.progress}%`} as CSSProperties}/>
            </div>
            <form ref={formRef} onSubmit={handleSubmit} className="rsvp-form" noValidate aria-busy={isSubmitting}>
                <div className="rsvp-step">
                    <div className="rsvp-step-header"><h2 ref={headingRef} tabIndex={-1}
                                                      className="section-title rsvp-section-title">{t(step.title)}</h2>{step.subtitle &&
                        <p className="section-subtitle">{t(step.subtitle)}</p>}</div>
                    {step.elements.map(renderField)}
                    {hasSubmissionError && <div ref={submissionErrorRef} className="rsvp-error-box" role="alert"
                                                tabIndex={-1}>
                        <p className="rsvp-error-box-text">{t(definition.messages.submitError)}</p>
                    </div>}
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

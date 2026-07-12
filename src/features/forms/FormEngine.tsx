import type {FormEvent} from 'react'
import {useLocalization} from '../../app/providers/useLocalization'
import type {FormDefinition, FormElement, FormValue} from '../../core/forms'
import {isConditionMet} from '../../core/forms'
import {useFormEngine} from './useFormEngine'

type Props<Message extends string> = {
    definition: FormDefinition<Message>
    isSubmitting: boolean
    onSubmit: (answers: Record<string, FormValue>) => Promise<void>
}

export function FormEngine<Message extends string>({definition, isSubmitting, onSubmit}: Readonly<Props<Message>>) {
    const {t} = useLocalization<Message>()
    const engine = useFormEngine(definition)
    const step = engine.currentStep
    if (!step) return null

    const submitOrAdvance = async () => {
        if (!engine.validateCurrent()) return
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

    const renderField = (element: FormElement<Message>) => {
        if (!isConditionMet(element.visibleWhen, engine.answers)) return null
        if (element.type === 'info') return <div key={element.id} className="rsvp-info-box">{t(element.label)}</div>
        const value = engine.answers[element.id]
        const error = errorMessage(element.id)
        const common = {id: element.id, className: `input ${error ? 'rsvp-input--error' : ''}`}

        if (element.type === 'radio') return (
            <div key={element.id} className="rsvp-field">
                <span className="label">{t(element.label)}</span>
                <div className="rsvp-option-grid">{element.options.map(option => (
                    <label key={String(option.value)}
                           className={`rsvp-option ${value === option.value ? 'rsvp-option--selected' : error ? 'rsvp-option--error' : ''}`}>
                        <input type="radio" checked={value === option.value}
                               onChange={() => engine.setValue(element.id, option.value)} className="rsvp-radio"/>
                        <span className="rsvp-option-label">{option.icon} {t(option.label)}</span>
                    </label>
                ))}</div>
                {error && <p className="rsvp-error-text">{error}</p>}
            </div>
        )

        if (element.type === 'checkbox-group') {
            const selected = Array.isArray(value) ? value : []
            return <div key={element.id} className="rsvp-field"><span className="label">{t(element.label)}</span>
                <div className="rsvp-dietary-list">{element.options.map(option => (
                    <label key={String(option.value)} className="rsvp-checkbox-option"><input type="checkbox"
                                                                                              checked={selected.includes(String(option.value))}
                                                                                              onChange={() => engine.setValue(element.id, selected.includes(String(option.value)) ? selected.filter(item => item !== String(option.value)) : [...selected, String(option.value)])}
                                                                                              className="rsvp-checkbox"/><span
                        className="text-sm">{t(option.label)}</span></label>
                ))}</div>
                {error && <p className="rsvp-error-text">{error}</p>}</div>
        }

        if (element.type === 'select') return <div key={element.id} className="rsvp-field"><label className="label"
                                                                                                  htmlFor={element.id}>{t(element.label)}</label><select {...common}
                                                                                                                                                         value={typeof value === 'string' ? value : ''}
                                                                                                                                                         onChange={event => engine.setValue(element.id, event.target.value)}>
            <option value="">{element.placeholder ? t(element.placeholder) : ''}</option>
            {element.options.map(option => <option key={String(option.value)}
                                                   value={String(option.value)}>{t(option.label)}</option>)}
        </select>{error && <p className="rsvp-error-text">{error}</p>}</div>

        if (element.type === 'textarea') return <div key={element.id} className="rsvp-field"><label className="label"
                                                                                                    htmlFor={element.id}>{t(element.label)}</label><textarea {...common}
                                                                                                                                                             rows={4}
                                                                                                                                                             value={typeof value === 'string' ? value : ''}
                                                                                                                                                             placeholder={element.placeholder ? t(element.placeholder) : undefined}
                                                                                                                                                             onChange={event => engine.setValue(element.id, event.target.value)}/>{error &&
            <p className="rsvp-error-text">{error}</p>}</div>

        return <div key={element.id} className="rsvp-field"><label className="label"
                                                                   htmlFor={element.id}>{t(element.label)}</label><input {...common}
                                                                                                                         type={element.type}
                                                                                                                         value={typeof value === 'string' || typeof value === 'number' ? value : ''}
                                                                                                                         placeholder={element.placeholder ? t(element.placeholder) : undefined}
                                                                                                                         onChange={event => engine.setValue(element.id, element.type === 'number' ? Number(event.target.value) : event.target.value)}/>{error &&
            <p className="rsvp-error-text">{error}</p>}</div>
    }

    return (
        <div className="card rsvp-card">
            <div className="rsvp-progress">
                <div className="rsvp-progress-bar"
                     style={{'--progress': `${engine.progress}%`} as React.CSSProperties}/>
            </div>
            <form onSubmit={handleSubmit} className="rsvp-form">
                <div className="rsvp-step">
                    <div><h2 className="section-title rsvp-section-title">{t(step.title)}</h2>{step.subtitle &&
                        <p className="section-subtitle">{t(step.subtitle)}</p>}</div>
                    {step.elements.map(renderField)}
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

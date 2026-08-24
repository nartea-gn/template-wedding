import {useEffect, useRef, useState, type FormEvent} from 'react'
import {useLocalization} from '../../app/providers/useLocalization'
import type {WeddingMessageKey} from '../../invitations/wedding'
import type {RsvpSubmissionRecord} from '../../features/rsvp/domain/RsvpSubmission'
import {InterfaceIcon} from '../ui/InterfaceIcon'
import './EditResponseModal.css'

type Props = {
    response: RsvpSubmissionRecord
    form: { id: string; steps: { elements: { id: string; type: string; label: string; options?: { value: string | boolean; label: string }[] }[] }[] }
    columns: readonly string[]
    onSave: (changes: Partial<Pick<RsvpSubmissionRecord, 'answers' | 'full_name' | 'attending' | 'dietary_options' | 'dietary_other' | 'bus_option' | 'song_request' | 'message' | 'locale'>>) => void
    onCancel: () => void
    saving: boolean
}

export function EditResponseModal({response, form, columns, onSave, onCancel, saving}: Props) {
    const {t} = useLocalization<WeddingMessageKey>()
    const fields = form.steps.flatMap(step => step.elements)
    const fieldMap = new Map(fields.map(field => [field.id, field]))
    const [answers, setAnswers] = useState<Record<string, unknown>>({...response.answers})
    const modalRef = useRef<HTMLDivElement>(null)
    const firstInputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        firstInputRef.current?.focus()
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') onCancel()
        }
        document.addEventListener('keydown', handleKeyDown)
        return () => document.removeEventListener('keydown', handleKeyDown)
    }, [onCancel])

    const handleSubmit = (event: FormEvent) => {
        event.preventDefault()
        onSave({answers})
    }

    return (
        <div className="modal-backdrop" onClick={onCancel}>
            <div className="modal" role="dialog" aria-modal="true" aria-label={t('admin.actions.edit')} ref={modalRef} onClick={event => event.stopPropagation()}>
                <div className="modal-header">
                    <h2 className="modal-title">{t('admin.actions.edit')}</h2>
                    <button type="button" className="btn btn--ghost modal-close" onClick={onCancel} aria-label={t('common.close')}>
                        <InterfaceIcon name="close" className="size-5"/>
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="modal-body">
                    {columns.map(id => {
                        const field = fieldMap.get(id)
                        if (!field) return null
                        const value = answers[id] ?? ''
                        if (field.type === 'checkbox-group') {
                            const options = field.options ?? []
                            const selected = Array.isArray(value) ? value : []
                            return (
                                <div key={id} className="form-field">
                                    <label className="label">{t(field.label)}</label>
                                    <div className="checkbox-group">
                                        {options.map(option => (
                                            <label key={String(option.value)} className="checkbox-label">
                                                <input
                                                    type="checkbox"
                                                    checked={selected.includes(String(option.value))}
                                                    onChange={event => {
                                                        const next = event.target.checked
                                                            ? [...selected, String(option.value)]
                                                            : selected.filter(item => item !== String(option.value))
                                                        setAnswers(prev => ({...prev, [id]: next}))
                                                    }}
                                                />
                                                <span>{t(option.label)}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            )
                        }
                        if (field.type === 'radio' || field.type === 'select') {
                            const options = field.options ?? []
                            return (
                                <div key={id} className="form-field">
                                    <label className="label">{t(field.label)}</label>
                                    <div className="radio-group">
                                        {options.map(option => (
                                            <label key={String(option.value)} className="radio-label">
                                                <input
                                                    type="radio"
                                                    name={`edit-${response.id}-${id}`}
                                                    checked={String(value) === String(option.value)}
                                                    onChange={() => setAnswers(prev => ({...prev, [id]: option.value}))}
                                                />
                                                <span>{t(option.label)}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            )
                        }
                        return (
                            <div key={id} className="form-field">
                                <label className="label">{t(field.label)}</label>
                                {field.type === 'textarea' ? (
                                    <textarea
                                        ref={id === columns[0] ? firstInputRef : undefined}
                                        className="input"
                                        value={String(value)}
                                        onChange={event => setAnswers(prev => ({...prev, [id]: event.target.value}))}
                                        rows={3}
                                    />
                                ) : (
                                    <input
                                        ref={id === columns[0] ? firstInputRef : undefined}
                                        type={field.type === 'email' ? 'email' : field.type === 'number' ? 'number' : 'text'}
                                        className="input"
                                        value={String(value)}
                                        onChange={event => setAnswers(prev => ({...prev, [id]: event.target.value}))}
                                    />
                                )}
                            </div>
                        )
                    })}
                    <div className="modal-footer">
                        <button type="button" className="btn btn--ghost" onClick={onCancel} disabled={saving}>
                            {t('common.close')}
                        </button>
                        <button type="submit" className="btn btn--primary" disabled={saving}>
                            {saving ? t('rsvp.submitting') : t('admin.actions.save')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

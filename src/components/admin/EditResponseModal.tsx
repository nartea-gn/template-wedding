import {useEffect, useRef, useState, type FormEvent, type RefObject} from 'react'
import {useLocalization} from '../../app/providers/useLocalization'
import type {WeddingMessageKey} from '../../invitations/wedding'
import type {RsvpRecordUpdate, RsvpSubmissionRecord} from '../../features/rsvp/domain/RsvpSubmission'
import type {FormAnswers, FormDefinition} from '../../core/forms'
import {InterfaceIcon} from '../ui/InterfaceIcon'
import './EditResponseModal.css'

const FOCUSABLE_SELECTOR = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

type Props = {
    response: RsvpSubmissionRecord
    form: FormDefinition<WeddingMessageKey>
    columns: readonly string[]
    onSave: (changes: Partial<RsvpRecordUpdate>) => Promise<boolean>
    onCancel: () => void
    saving: boolean
}

/**
 * Modal that lets the couple correct a single guest answer from the admin panel.
 *
 * Keyboard focus is trapped inside the dialog while it is open, so `aria-modal="true"`
 * matches the actual behaviour instead of only describing it.
 */
export function EditResponseModal({response, form, columns, onSave, onCancel, saving}: Props) {
    const {t} = useLocalization<WeddingMessageKey>()
    const fields = form.steps.flatMap(step => step.elements)
    const fieldMap = new Map(fields.map(field => [field.id, field]))
    const [answers, setAnswers] = useState<FormAnswers>({...response.answers})
    const [failed, setFailed] = useState(false)
    const modalRef = useRef<HTMLDivElement>(null)
    const firstFieldRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null)

    useEffect(() => {
        firstFieldRef.current?.focus()
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') onCancel()
            if (event.key === 'Tab' && modalRef.current) {
                const focusable = modalRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
                const first = focusable[0]
                const last = focusable[focusable.length - 1]
                if (event.shiftKey && document.activeElement === first) {
                    event.preventDefault()
                    last?.focus()
                } else if (!event.shiftKey && document.activeElement === last) {
                    event.preventDefault()
                    first?.focus()
                }
            }
        }
        document.addEventListener('keydown', handleKeyDown)
        return () => document.removeEventListener('keydown', handleKeyDown)
    }, [onCancel])

    const handleSubmit = async (event: FormEvent) => {
        event.preventDefault()
        setFailed(false)
        // The draft stays mounted on failure: closing the modal would discard everything the
        // couple typed, which is the difference between "retry" and "type it all again".
        if (!await onSave({answers})) setFailed(true)
    }

    const guestName = String(answers.fullName ?? response.answers.fullName ?? '')

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
                            const selected = Array.isArray(value) ? value : []
                            return (
                                <div key={id} className="form-field">
                                    <label className="label">{t(field.label)}</label>
                                    <div className="checkbox-group">
                                        {field.options.map(option => (
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
                            return (
                                <div key={id} className="form-field">
                                    <label className="label">{t(field.label)}</label>
                                    <div className="radio-group">
                                        {field.options.map(option => (
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
                                        ref={id === columns[0] ? (firstFieldRef as RefObject<HTMLTextAreaElement>) : undefined}
                                        className="input"
                                        value={String(value)}
                                        onChange={event => setAnswers(prev => ({...prev, [id]: event.target.value}))}
                                        rows={3}
                                    />
                                ) : (
                                    <input
                                        ref={id === columns[0] ? (firstFieldRef as RefObject<HTMLInputElement>) : undefined}
                                        type={field.type === 'email' ? 'email' : field.type === 'number' ? 'number' : 'text'}
                                        className="input"
                                        value={String(value)}
                                        onChange={event => setAnswers(prev => ({...prev, [id]: event.target.value}))}
                                    />
                                )}
                            </div>
                        )
                    })}
                    {failed && (
                        <p className="modal-error" role="alert">
                            {t('admin.actions.updateError').replace('{guest}', guestName)}
                        </p>
                    )}
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

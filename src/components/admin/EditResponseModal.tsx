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
    /**
     * Ref to the control that opened the dialog, so focus can be handed back to it on close.
     *
     * Handed over rather than read from `document.activeElement`: on macOS, WebKit does not move
     * focus to a button when it is clicked with a mouse, so the active element at mount was
     * already `BODY` and the couple was returned to the top of a 58-row table. Chromium focuses
     * it, which is why the e2e caught this only in the cross-browser run.
     *
     * A ref and not the element itself: reading `.current` during the parent's render is what the
     * compiler forbids, and the only moment this is needed is inside the effect below.
     */
    openerRef?: RefObject<HTMLElement | null>
}

/**
 * Modal that lets the couple correct a single guest answer from the admin panel.
 *
 * Keyboard focus is trapped inside the dialog while it is open, so `aria-modal="true"`
 * matches the actual behaviour instead of only describing it.
 */
export function EditResponseModal({response, form, columns, onSave, onCancel, saving, openerRef}: Props) {
    const {t} = useLocalization<WeddingMessageKey>()
    const fields = form.steps.flatMap(step => step.elements)
    const fieldMap = new Map(fields.map(field => [field.id, field]))
    const [answers, setAnswers] = useState<FormAnswers>({...response.answers})
    const [failed, setFailed] = useState(false)
    const modalRef = useRef<HTMLDivElement>(null)
    const firstFieldRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null)

    /*
     * QUIEN ABRIO EL MODAL RECUPERA EL FOCO AL CERRARLO
     *
     * Sin esto el foco quedaba en `BODY`, asi que un usuario de teclado volvia al enlace de salto
     * y tenia que recorrer ~20 paradas para regresar a la fila que acababa de editar.
     *
     * Se resuelve una sola vez y en su propio efecto. Antes vivia junto al listener de teclado,
     * cuyas dependencias incluyen `onCancel` -- una flecha nueva en cada render del panel -- de
     * modo que el efecto se rehacia continuamente: cada pasada devolvia el foco al "opener" y lo
     * volvia a llevar al primer campo, y a partir de la segunda el "opener" leido de
     * `document.activeElement` ya era un campo del propio modal, que al cerrarse esta desmontado
     * y no acepta foco.
     */
    useEffect(() => {
        const opening = openerRef?.current ?? (document.activeElement as HTMLElement | null)
        firstFieldRef.current?.focus()
        // El fondo no scrollea mientras el modal esta abierto: sin esto, una rueda o un gesto
        // sobre el backdrop movia la pagina de debajo y al cerrar el modal el usuario aparecia
        // en otro sitio de una tabla de 58 filas.
        const previousOverflow = document.body.style.overflow
        document.body.style.overflow = 'hidden'
        return () => {
            document.body.style.overflow = previousOverflow
            if (opening?.isConnected) opening.focus()
        }
        // `openerRef` es un `useRef` del panel: su identidad no cambia, asi que esto sigue
        // corriendo una sola vez -- que es justo lo que hace falta para no devolver el foco a
        // mitad de la edicion.
    }, [openerRef])

    useEffect(() => {
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
    // Un toque en el fondo cierra solo si no hay nada escrito. Con cambios sin guardar era una
    // via de perdida de datos a un dedo de distancia, y en un movil el fondo es casi todo lo que
    // rodea al modal. Escape y el boton de cerrar siguen cerrando: son actos deliberados.
    const isDirty = JSON.stringify(answers) !== JSON.stringify(response.answers)

    return (
        <div className="modal-backdrop" onClick={() => { if (!isDirty) onCancel() }}>
            {/* El nombre del invitado en el titulo y en el nombre accesible: con 58 filas y un
                movil, "Editar" a secas no dice de quien es el registro que se esta cambiando. */}
            <div className="modal" role="dialog" aria-modal="true"
                 aria-label={`${t('admin.actions.edit')} · ${guestName}`} ref={modalRef} onClick={event => event.stopPropagation()}>
                <div className="modal-header">
                    <h2 className="modal-title">{t('admin.actions.edit')} · {guestName}</h2>
                    <button type="button" className="btn btn--ghost modal-close" onClick={onCancel} aria-label={t('common.close')}>
                        <InterfaceIcon name="close" className="size-5"/>
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="modal-form">
                    <div className="modal-body">
                    {columns.map(id => {
                        const field = fieldMap.get(id)
                        if (!field) return null
                        const value = answers[id] ?? ''
                        if (field.type === 'checkbox-group') {
                            const selected = Array.isArray(value) ? value : []
                            return (
                                <fieldset key={id} className="form-field">
                                    {/* `fieldset`/`legend` y no un `<label>` sin `for` usado de
                                        titulo: aquel no nombraba nada y dejaba el grupo anonimo. */}
                                    <legend className="label">{t(field.label)}</legend>
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
                                </fieldset>
                            )
                        }
                        if (field.type === 'radio' || field.type === 'select') {
                            return (
                                <fieldset key={id} className="form-field">
                                    <legend className="label">{t(field.label)}</legend>
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
                                </fieldset>
                            )
                        }
                        // `htmlFor` e `id` emparejados: los cuatro campos de texto se anunciaban
                        // sin nombre accesible, asi que editar una respuesta eran cuatro campos
                        // anonimos seguidos.
                        const fieldId = `edit-${response.id}-${id}`
                        return (
                            <div key={id} className="form-field">
                                <label className="label" htmlFor={fieldId}>{t(field.label)}</label>
                                {field.type === 'textarea' ? (
                                    <textarea
                                        id={fieldId}
                                        ref={id === columns[0] ? (firstFieldRef as RefObject<HTMLTextAreaElement>) : undefined}
                                        className="input"
                                        value={String(value)}
                                        onChange={event => setAnswers(prev => ({...prev, [id]: event.target.value}))}
                                        rows={3}
                                    />
                                ) : (
                                    <input
                                        id={fieldId}
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
                    </div>
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

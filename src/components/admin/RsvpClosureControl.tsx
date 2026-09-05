import {useState, type FormEvent} from 'react'
import {useLocalization} from '../../app/providers/useLocalization'
import type {WeddingMessageKey} from '../../invitations/wedding'
import type {RsvpScheduleUpdate, RsvpStatus} from '../../features/rsvp/domain/RsvpStatus'
import './RsvpClosureControl.css'

type Props = {
    status: RsvpStatus | null
    saving: boolean
    onSave: (schedule: RsvpScheduleUpdate) => Promise<boolean>
}

type Mode = 'auto' | 'open' | 'closed'

/** Converts an ISO instant into the value a `datetime-local` input expects, in local time. */
function toLocalInputValue(iso: string | null): string {
    if (!iso) return ''
    const date = new Date(iso)
    if (Number.isNaN(date.getTime())) return ''
    const offsetMs = date.getTimezoneOffset() * 60_000
    return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16)
}

/**
 * Lets the couple move the RSVP deadline or force the form open or closed, with immediate
 * effect and without a redeploy.
 *
 * The manual switch beats the deadline; "automatic" hands the decision back to it. Saving
 * follows the Promise<boolean> convention of the rest of the panel, so a failed write never
 * reads as a success.
 */
export function RsvpClosureControl({status, saving, onSave}: Props) {
    const {t} = useLocalization<WeddingMessageKey>()
    // `null` means "untouched", so the field keeps following the database until the couple
    // types something. Deriving it beats syncing it from an effect.
    const [draftDeadline, setDraftDeadline] = useState<string | null>(null)
    const [mode, setMode] = useState<Mode>('auto')
    const [failed, setFailed] = useState(false)
    const deadline = draftDeadline ?? toLocalInputValue(status?.deadlineUtc ?? null)

    const handleSubmit = async (event: FormEvent) => {
        event.preventDefault()
        setFailed(false)
        const schedule: RsvpScheduleUpdate = {
            override: mode === 'auto' ? null : mode,
        }
        if (deadline) schedule.deadlineUtc = new Date(deadline).toISOString()
        if (!await onSave(schedule)) setFailed(true)
    }

    return (
        <form className="card admin-rsvp-closure" onSubmit={handleSubmit}>
            <h2 className="admin-rsvp-closure-title">{t('admin.rsvp.title')}</h2>
            <p className="admin-rsvp-closure-state" role="status">
                {status === null
                    ? t('admin.rsvp.unknown')
                    : status.isOpen ? t('admin.rsvp.stateOpen') : t('admin.rsvp.stateClosed')}
            </p>
            <label className="label" htmlFor="admin-rsvp-deadline">{t('admin.rsvp.deadline')}</label>
            <input
                id="admin-rsvp-deadline"
                className="input"
                type="datetime-local"
                value={deadline}
                onChange={event => setDraftDeadline(event.target.value)}
            />
            <fieldset className="admin-rsvp-closure-modes">
                <legend className="label">{t('admin.rsvp.mode')}</legend>
                {(['auto', 'open', 'closed'] as const).map(option => (
                    <label key={option} className="radio-label">
                        <input
                            type="radio"
                            name="admin-rsvp-mode"
                            checked={mode === option}
                            onChange={() => setMode(option)}
                        />
                        <span>{t(`admin.rsvp.mode.${option}` as WeddingMessageKey)}</span>
                    </label>
                ))}
            </fieldset>
            <button type="submit" className="btn btn--primary" disabled={saving}>
                {t('admin.rsvp.save')}
            </button>
            {failed && <p className="admin-rsvp-closure-error" role="alert">{t('admin.rsvp.error')}</p>}
        </form>
    )
}

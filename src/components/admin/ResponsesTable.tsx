import type {FormDefinition} from '../../core/forms';
import type {RsvpRecordUpdate, RsvpSubmissionRecord} from '../../features/rsvp/domain/RsvpSubmission';
import {useLocalization} from '../../app/providers/useLocalization';
import {useEffect, useRef, useState} from 'react';
import type {WeddingMessageKey} from '../../invitations/wedding';
import {formatResponseValue, getFormFields} from '../../features/admin/presentation/responsePresentation';
import {InterfaceIcon} from '../ui/InterfaceIcon';
import {EditResponseModal} from './EditResponseModal';
import './ResponsesTable.css';

type Props = {
    responses: RsvpSubmissionRecord[]; loading: boolean; hasError: boolean;
    errorMessage: string | null; form: FormDefinition<WeddingMessageKey>; columns: readonly string[];
    onRetry: () => void;
    onUpdate: (id: number, changes: Partial<RsvpRecordUpdate>) => Promise<boolean>;
    onDelete: (id: number) => void;
    onRestore: (id: number) => void;
    /** Id of the row whose last delete or restore failed, if any. */
    rowError: number | null;
};

export function ResponsesTable({responses, loading, hasError, errorMessage, form, columns, onRetry, onUpdate, onDelete, onRestore, rowError}: Props) {
    const {t} = useLocalization<WeddingMessageKey>();
    const fields = getFormFields(form);
    const [editingId, setEditingId] = useState<number | null>(null)
    const [confirmingId, setConfirmingId] = useState<number | null>(null)
    const editingResponse = responses.find(item => item.id === editingId) ?? null

    return <section className="card responses-table" aria-busy={loading}>
        {hasError ?
            <div className="responses-state responses-state--error" role="alert">
                <InterfaceIcon name="alert-triangle" className="responses-state-icon"/>
                <span>{errorMessage ?? t('admin.loadError')}</span>
                <button type="button" className="btn btn--outline responses-retry" onClick={onRetry}>
                    {t('admin.retry')}
                </button>
            </div>
            : loading ? <div className="responses-state responses-state--muted" role="status" aria-live="polite">
                    <div className="responses-spinner"/>
                    {t('admin.loading')}</div>
                : responses.length === 0 ?
                    <div className="responses-state responses-state--muted" role="status">
                        <InterfaceIcon name="inbox" className="responses-state-icon"/>
                        <span>{t('admin.empty')}</span>
                    </div>
                    : <div className="responses-scroll" role="region" aria-label={t('admin.table.label')} tabIndex={0}>
                        <table className="responses-table-el" role="table">
                            <caption className="sr-only">{t('admin.table.label')}</caption>
                            <thead role="rowgroup">
                            <tr className="responses-head-row" role="row">{columns.map(id => <th key={id} scope="col" role="columnheader"
                                                                                       className="responses-th">{fields.has(id) ? t(fields.get(id)!.label) : id}</th>)}<th scope="col" role="columnheader" className="responses-th">{t('admin.actions.label')}</th></tr>
                            </thead>
                            <tbody className="responses-body" role="rowgroup">{responses.map(response => <tr key={response.id} role="row"
                                                                                             className={`responses-row ${response.deletedAt ? 'responses-row--deleted' : ''}`}>
                                {columns.map(id => {
                                    const value = response.answers[id];
                                    const formattedValue = formatResponseValue(
                                        value,
                                        fields.get(id),
                                        t,
                                        {yes: 'common.yes', no: 'common.no'},
                                    );
                                    const label = fields.has(id) ? t(fields.get(id)!.label) : id;
                                    return <td key={id} role="cell" className="responses-td">
                                        <span className="responses-cell-label" aria-hidden="true">{label}</span>
                                        {typeof value === 'boolean' ? <span
                                            className={`responses-badge responses-badge--${value ? 'yes' : 'no'}`}>
                                            <InterfaceIcon name={value ? 'check' : 'close'}
                                                           className="responses-badge-icon"/>
                                            {formattedValue}
                                        </span> : formattedValue}
                                    </td>;
                                })}
                                <td role="cell" className="responses-td">
                                    <div className="responses-actions">
                                        <button type="button" className="btn btn--ghost responses-action"
                                                onClick={() => setEditingId(response.id)}>
                                            {t('admin.actions.edit')}
                                        </button>
                                        {response.deletedAt
                                            ? <button type="button" className="btn btn--ghost responses-action"
                                                      onClick={() => onRestore(response.id)}>
                                                {t('admin.actions.restore')}
                                            </button>
                                            : confirmingId === response.id
                                                ? <DeleteConfirmation
                                                    guestName={String(response.answers.fullName ?? '')}
                                                    onConfirm={() => {
                                                        setConfirmingId(null)
                                                        onDelete(response.id)
                                                    }}
                                                    onDismiss={() => setConfirmingId(null)}/>
                                                : <button type="button"
                                                          className="btn btn--ghost responses-action responses-action--danger"
                                                          onClick={() => setConfirmingId(response.id)}>
                                                    {t('admin.actions.delete')}
                                                </button>}
                                    </div>
                                    {rowError === response.id && (
                                        <p className="responses-row-error" role="alert">{t('admin.actions.rowError')}</p>
                                    )}
                                </td>
                            </tr>)}</tbody>
                        </table>
                    </div>}
        {editingResponse && (
            <EditResponseModal
                response={editingResponse}
                form={form}
                columns={columns}
                onSave={async changes => {
                    const saved = await onUpdate(editingResponse.id, changes)
                    if (saved) setEditingId(null)
                    return saved
                }}
                onCancel={() => setEditingId(null)}
                saving={loading}
            />
        )}
    </section>;
}

type DeleteConfirmationProps = {
    guestName: string;
    onConfirm: () => void;
    onDismiss: () => void;
};

/**
 * Inline confirmation for a deletion, naming the guest whose answers are about to disappear.
 *
 * Inline rather than a dialog: it replaces the control the administrator just pressed, so the
 * answer stays beside the row it affects and no focus trap has to be maintained. Focus does move
 * to the confirming button, because the control that had it no longer exists.
 */
function DeleteConfirmation({guestName, onConfirm, onDismiss}: Readonly<DeleteConfirmationProps>) {
    const {t} = useLocalization<WeddingMessageKey>();
    const confirmRef = useRef<HTMLButtonElement>(null);
    const question = t('admin.actions.confirmDelete').replace('{guest}', guestName);

    useEffect(() => {
        confirmRef.current?.focus();
    }, []);

    return <div className="responses-confirm" role="group" aria-label={question}>
        <p className="responses-confirm-question">{question}</p>
        <p className="responses-confirm-hint">{t('admin.actions.confirmDeleteHint')}</p>
        <div className="responses-confirm-actions">
            <button type="button" ref={confirmRef}
                    className="btn btn--ghost responses-action responses-action--danger"
                    onClick={onConfirm}>
                {t('admin.actions.confirmDeleteYes')}
            </button>
            <button type="button" className="btn btn--ghost responses-action" onClick={onDismiss}>
                {t('admin.actions.confirmDeleteNo')}
            </button>
        </div>
    </div>;
}

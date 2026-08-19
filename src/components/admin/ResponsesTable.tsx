import type {FormDefinition} from '../../core/forms';
import type {RsvpSubmissionRecord} from '../../features/rsvp/domain/RsvpSubmission';
import {useLocalization} from '../../app/providers/useLocalization';
import {useState} from 'react';
import type {WeddingMessageKey} from '../../invitations/wedding';
import {formatResponseValue, getFormFields} from '../../features/admin/presentation/responsePresentation';
import {InterfaceIcon} from '../ui/InterfaceIcon';
import {EditResponseModal} from './EditResponseModal';
import './ResponsesTable.css';

type Props = {
    responses: RsvpSubmissionRecord[]; loading: boolean; hasError: boolean;
    errorMessage: string | null; form: FormDefinition<WeddingMessageKey>; columns: readonly string[];
    onRetry: () => void;
    onUpdate: (id: number, changes: Partial<Pick<RsvpSubmissionRecord, 'answers' | 'full_name' | 'attending' | 'dietary_options' | 'dietary_other' | 'bus_option' | 'song_request' | 'message' | 'locale'>>) => void;
    onDelete: (id: number) => void;
    onRestore: (id: number) => void;
};

export function ResponsesTable({responses, loading, hasError, errorMessage, form, columns, onRetry, onUpdate, onDelete, onRestore}: Props) {
    const {t} = useLocalization<WeddingMessageKey>();
    const fields = getFormFields(form);
    const [editingId, setEditingId] = useState<number | null>(null)
    const editingResponse = responses.find(item => item.id === editingId) ?? null

    return <main className="card responses-table" aria-busy={loading}>
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
                        <table className="responses-table-el">
                            <caption className="sr-only">{t('admin.table.label')}</caption>
                            <thead>
                            <tr className="responses-head-row">{columns.map(id => <th key={id} scope="col"
                                                                                       className="responses-th">{fields.has(id) ? t(fields.get(id)!.label) : id}</th>)}<th scope="col" className="responses-th">{t('admin.actions.label')}</th></tr>
                            </thead>
                            <tbody className="responses-body">{responses.map(response => <tr key={response.id}
                                                                                             className={`responses-row ${response.deletedAt ? 'responses-row--deleted' : ''}`}>
                                {columns.map(id => {
                                    const value = response.answers[id];
                                    const formattedValue = formatResponseValue(
                                        value,
                                        fields.get(id),
                                        t,
                                        {yes: 'common.yes', no: 'common.no'},
                                    );
                                    return <td key={id} className="responses-td">
                                        {typeof value === 'boolean' ? <span
                                            className={`responses-badge responses-badge--${value ? 'yes' : 'no'}`}>
                                            <InterfaceIcon name={value ? 'check' : 'close'}
                                                           className="responses-badge-icon"/>
                                            {formattedValue}
                                        </span> : formattedValue}
                                    </td>;
                                })}
                                <td className="responses-td">
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
                                            : <button type="button" className="btn btn--ghost responses-action responses-action--danger"
                                                      onClick={() => onDelete(response.id)}>
                                                {t('admin.actions.delete')}
                                            </button>}
                                    </div>
                                </td>
                            </tr>)}</tbody>
                        </table>
                    </div>}
        {editingResponse && (
            <EditResponseModal
                response={editingResponse}
                form={form}
                columns={columns}
                onSave={changes => {
                    onUpdate(editingResponse.id, changes)
                    setEditingId(null)
                }}
                onCancel={() => setEditingId(null)}
                saving={loading}
            />
        )}
    </main>;
}

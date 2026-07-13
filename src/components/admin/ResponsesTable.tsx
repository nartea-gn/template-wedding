import type {FormDefinition} from '../../core/forms';
import type {RsvpSubmissionRecord} from '../../features/rsvp/domain/RsvpSubmission';
import {useLocalization} from '../../app/providers/useLocalization';
import type {WeddingMessageKey} from '../../invitations/wedding';
import {formatResponseValue, getFormFields} from '../../features/admin/presentation/responsePresentation';
import {InterfaceIcon} from '../ui/InterfaceIcon';
import './ResponsesTable.css';

type Props = {
    responses: RsvpSubmissionRecord[]; loading: boolean; hasError: boolean;
    form: FormDefinition<WeddingMessageKey>; columns: readonly string[];
    onRetry: () => void
};

export function ResponsesTable({responses, loading, hasError, form, columns, onRetry}: Props) {
    const {t} = useLocalization<WeddingMessageKey>();
    const fields = getFormFields(form);
    return <main className="card responses-table" aria-busy={loading}>
        {hasError ?
            <div className="responses-state responses-state--error" role="alert">
                <InterfaceIcon name="alert-triangle" className="responses-state-icon"/>
                <span>{t('admin.loadError')}</span>
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
                                                                                      className="responses-th">{fields.has(id) ? t(fields.get(id)!.label) : id}</th>)}</tr>
                            </thead>
                            <tbody className="responses-body">{responses.map(response => <tr key={response.id}
                                                                                             className="responses-row">
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
                            </tr>)}</tbody>
                        </table>
                    </div>}
    </main>;
}

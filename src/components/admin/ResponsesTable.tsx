import type {FormDefinition, FormElement, FormValue} from '../../core/forms';
import type {RsvpSubmissionRecord} from '../../features/rsvp/domain/RsvpSubmission';
import {useLocalization} from '../../app/providers/useLocalization';
import type {WeddingMessageKey} from '../../invitations/wedding';
import './ResponsesTable.css';

type Props = {
    responses: RsvpSubmissionRecord[]; loading: boolean; hasError: boolean;
    form: FormDefinition<WeddingMessageKey>; columns: readonly string[];
    onRetry: () => void
};

export function ResponsesTable({responses, loading, hasError, form, columns, onRetry}: Props) {
    const {t} = useLocalization<WeddingMessageKey>();
    const fields = new Map(form.steps.flatMap(step => step.elements).map(field => [field.id, field]));
    const formatValue = (value: FormValue | undefined, field?: FormElement<WeddingMessageKey>) => {
        if (value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0)) return '—';
        if (typeof value === 'boolean') return value ? `✓ ${t('common.yes')}` : `✗ ${t('common.no')}`;
        const options = field && 'options' in field ? field.options : [];
        const labelFor = (item: string) => {
            const option = options.find(candidate => String(candidate.value) === item);
            return option ? t(option.label) : item;
        };
        return Array.isArray(value) ? value.map(labelFor).join(', ') : labelFor(String(value));
    };
    return <main className="card responses-table" aria-busy={loading}>
        {hasError ?
            <div className="responses-state responses-state--error" role="alert">
                <span>⚠️ {t('admin.loadError')}</span>
                <button type="button" className="btn btn--outline responses-retry" onClick={onRetry}>
                    {t('admin.retry')}
                </button>
            </div>
            : loading ? <div className="responses-state responses-state--muted" role="status" aria-live="polite">
                    <div className="responses-spinner"/>
                    {t('admin.loading')}</div>
                : responses.length === 0 ?
                    <div className="responses-state responses-state--muted" role="status">📭 {t('admin.empty')}</div>
                    : <div className="responses-scroll" role="region" aria-label={t('admin.table.label')} tabIndex={0}>
                        <table className="responses-table-el">
                            <caption className="sr-only">{t('admin.table.label')}</caption>
                            <thead>
                            <tr className="responses-head-row">{columns.map(id => <th key={id} scope="col"
                                                                                      className="responses-th">{fields.has(id) ? t(fields.get(id)!.label) : id}</th>)}</tr>
                            </thead>
                            <tbody className="responses-body">{responses.map(response => <tr key={response.id}
                                                                                             className="responses-row">
                                {columns.map(id => <td key={id}
                                                       className="responses-td">{formatValue(response.answers[id], fields.get(id))}</td>)}
                            </tr>)}</tbody>
                        </table>
                    </div>}
    </main>;
}

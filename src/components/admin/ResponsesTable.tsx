import type {FormDefinition, FormElement, FormValue} from '../../core/forms';
import type {RsvpSubmissionRecord} from '../../features/rsvp/domain/RsvpSubmission';
import {useLocalization} from '../../app/providers/useLocalization';
import type {WeddingMessageKey} from '../../invitations/wedding';
import './ResponsesTable.css';

type Props = {
    responses: RsvpSubmissionRecord[]; loading: boolean; error: string | null;
    form: FormDefinition<WeddingMessageKey>; columns: readonly string[]
};

export function ResponsesTable({responses, loading, error, form, columns}: Props) {
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
    return <main className="card responses-table">
        {error ?
            <div className="responses-state responses-state--error" role="alert">⚠️ {t('admin.loadError')} {error}</div>
            : loading ? <div className="responses-state responses-state--muted">
                    <div className="responses-spinner"/>
                    {t('admin.loading')}</div>
                : responses.length === 0 ?
                    <div className="responses-state responses-state--muted">📭 {t('admin.empty')}</div>
                    : <div className="responses-scroll">
                        <table className="responses-table-el">
                            <thead>
                            <tr className="responses-head-row">{columns.map(id => <th key={id}
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

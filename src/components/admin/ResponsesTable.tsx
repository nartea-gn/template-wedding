import type {RsvpResponse} from '../../types/rsvp';
import './ResponsesTable.css';
import {useLocalization} from '../../app/providers/useLocalization';
import type {WeddingMessageKey} from '../../invitations/wedding';

type ResponsesTableProps = {
    responses: RsvpResponse[];
    loading: boolean;
    error: string | null;
};

export function ResponsesTable({responses, loading, error}: ResponsesTableProps) {
    const {t} = useLocalization<WeddingMessageKey>();
    const dietaryLabels: Record<string, WeddingMessageKey> = {
        none: 'rsvp.dietary.none', gluten: 'rsvp.dietary.gluten', vegetarian: 'rsvp.dietary.vegetarian',
        lactose: 'rsvp.dietary.lactose', nuts_seafood: 'rsvp.dietary.nutsSeafood',
    };
    const busLabels: Record<string, WeddingMessageKey> = {
        ida_vuelta: 'rsvp.bus.roundTrip', solo_ida: 'rsvp.bus.outbound', solo_vuelta: 'rsvp.bus.return', no: 'rsvp.bus.no',
    };
    return (
        <main className="card responses-table">
            {error ? (
                <div className="responses-state responses-state--error" role="alert">
                    <span className="responses-state-icon">⚠️</span>
                    {t('admin.loadError')} {error}
                </div>
            ) : loading ? (
                <div className="responses-state responses-state--muted">
                    <div className="responses-spinner"/>
                    {t('admin.loading')}
                </div>
            ) : responses.length === 0 ? (
                <div className="responses-state responses-state--muted">
                    <span className="responses-state-icon">📭</span>
                    {t('admin.empty')}
                </div>
            ) : (
                <div className="responses-scroll">
                    <table className="responses-table-el">
                        <thead>
                        <tr className="responses-head-row">
                            <th className="responses-th">{t('admin.guest')}</th>
                            <th className="responses-th">{t('admin.attends')}</th>
                            <th className="responses-th">{t('admin.dietary')}</th>
                            <th className="responses-th">{t('admin.bus')}</th>
                            <th className="responses-th">{t('admin.song')}</th>
                            <th className="responses-th">{t('admin.message')}</th>
                        </tr>
                        </thead>
                        <tbody className="responses-body">
                        {responses.map((item) => (
                            <tr key={item.id} className="responses-row">
                                <td className="responses-td">{item.fullName}</td>
                                <td className="responses-td">
                                    <span
                                        className={`responses-badge ${
                                            item.attending
                                                ? 'responses-badge--yes'
                                                : 'responses-badge--no'
                                        }`}
                                    >
                                        {item.attending ? `✓ ${t('common.yes')}` : `✗ ${t('common.no')}`}
                                    </span>
                                </td>
                                <td className="responses-td-muted">
                                    {item.dietaryOptions.map(value => dietaryLabels[value] ? t(dietaryLabels[value]) : value).join(', ') || '—'}
                                    {item.dietaryOther && ` (${item.dietaryOther})`}
                                </td>
                                <td className="responses-td-cap">
                                    {item.busOption ? t(busLabels[item.busOption] ?? 'rsvp.bus.no') : '—'}
                                </td>
                                <td className="responses-td-italic">
                                    {item.songRequest || '—'}
                                </td>
                                <td className="responses-td-message" title={item.message || ''}>
                                    {item.message || '—'}
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            )}
        </main>
    );
}

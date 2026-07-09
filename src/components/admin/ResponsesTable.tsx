import type {RsvpResponse} from '../../types/rsvp';
import './ResponsesTable.css';

type ResponsesTableProps = {
    responses: RsvpResponse[];
    loading: boolean;
    error: string | null;
};

export function ResponsesTable({responses, loading, error}: ResponsesTableProps) {
    return (
        <main className="responses-table">
            {error ? (
                <div className="responses-state responses-state--error" role="alert">
                    <span className="responses-state-icon">⚠️</span>
                    No se pudieron cargar las respuestas: {error}
                </div>
            ) : loading ? (
                <div className="responses-state responses-state--muted">
                    <div className="responses-spinner"/>
                    Cargando...
                </div>
            ) : responses.length === 0 ? (
                <div className="responses-state responses-state--muted">
                    <span className="responses-state-icon">📭</span>
                    No hay respuestas que mostrar.
                </div>
            ) : (
                <div className="responses-scroll">
                    <table className="responses-table-el">
                        <thead>
                        <tr className="responses-head-row">
                            <th className="responses-th">Invitado</th>
                            <th className="responses-th">Asiste</th>
                            <th className="responses-th">Restricciones alimentarias</th>
                            <th className="responses-th">Autobús</th>
                            <th className="responses-th">Canción</th>
                            <th className="responses-th">Mensaje</th>
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
                                        {item.attending ? '✓ Sí' : '✗ No'}
                                    </span>
                                </td>
                                <td className="responses-td-muted">
                                    {item.dietaryOptions.join(', ') || '—'}
                                    {item.dietaryOther && ` (${item.dietaryOther})`}
                                </td>
                                <td className="responses-td-cap">
                                    {item.busOption?.replaceAll('_', ' ') || '—'}
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

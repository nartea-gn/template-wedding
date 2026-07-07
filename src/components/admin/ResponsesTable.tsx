import type {RsvpResponse} from '../../types/rsvp';

type ResponsesTableProps = {
    responses: RsvpResponse[];
    loading: boolean;
    error: string | null;
};

export function ResponsesTable({responses, loading, error}: ResponsesTableProps) {
    return (
        <main className="bg-white rounded-xl border overflow-hidden shadow-sm">
            {error ? (
                <div className="p-12 text-center text-sm text-red-600" role="alert">
                    No se pudieron cargar las respuestas: {error}
                </div>
            ) : loading ? (
                <div className="p-12 text-center text-sm text-wedding-primary/60">Cargando...</div>
            ) : responses.length === 0 ? (
                <div className="p-12 text-center text-sm text-wedding-primary/60">No hay respuestas que mostrar.</div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                        <tr className="bg-wedding-bg/50 border-b text-xs uppercase text-wedding-primary/70">
                            <th className="p-4 font-semibold">Invitado</th>
                            <th className="p-4 font-semibold">Asiste</th>
                            <th className="p-4 font-semibold">Menú</th>
                            <th className="p-4 font-semibold">Autobús</th>
                            <th className="p-4 font-semibold">Canción</th>
                            <th className="p-4 font-semibold">Mensaje</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y text-sm">
                        {responses.map((item) => (
                            <tr key={item.id} className="hover:bg-wedding-bg/20">
                                <td className="p-4 font-medium">{item.fullName}</td>
                                <td className="p-4"><span
                                    className={`px-2 py-0.5 rounded-full text-xs ${item.attending ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{item.attending ? 'Sí' : 'No'}</span>
                                </td>
                                <td className="p-4 text-xs">{item.dietaryOptions.join(', ')} {item.dietaryOther && `(${item.dietaryOther})`}</td>
                                <td className="p-4 text-xs capitalize">{item.busOption?.replaceAll('_', ' ') || '—'}</td>
                                <td className="p-4 text-xs italic">{item.songRequest || '—'}</td>
                                <td className="p-4 text-xs text-wedding-primary/80">{item.message || '—'}</td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            )}
        </main>
    );
}

import React, {useEffect, useState} from 'react';
import {supabase} from '../lib/supabaseClient';
import {weddingConfig} from '../config/wedding.config';

interface RsvpResponse {
    id: string;
    wedding_slug: string;
    full_name: string;
    attending: boolean;
    dietary_options: string[];
    dietary_other: string | null;
    bus_option: string | null;
    song_request: string | null;
    message: string | null;
    created_at: string;
}

export default function AdminRsvpPage() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [passwordInput, setPasswordInput] = useState('');
    const [passwordError, setPasswordError] = useState(false);
    const [responses, setResponses] = useState<RsvpResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'yes' | 'no'>('all');

    const CORRECT_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || 'boda2027';

    const handlePasswordSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (passwordInput === CORRECT_PASSWORD) {
            setIsAuthenticated(true);
            setPasswordError(false);
            sessionStorage.setItem('admin_authed', 'true');
        } else {
            setPasswordError(true);
        }
    };

    useEffect(() => {
        if (sessionStorage.getItem('admin_authed') === 'true') {
            setIsAuthenticated(true);
        }
    }, []);

    useEffect(() => {
        if (!isAuthenticated) return;

        async function fetchResponses() {
            try {
                setLoading(true);
                // Filtrado por slug de boda añadido aquí: .eq(...)
                const {data, error} = await supabase
                    .from('rsvp_responses')
                    .select('*')
                    .eq('wedding_slug', weddingConfig.event.slug)
                    .order('created_at', {ascending: false});

                if (error) throw error;
                setResponses(data || []);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }

        fetchResponses();
    }, [isAuthenticated]);

    const totalRespuestas = responses.length;
    const confirmados = responses.filter(r => r.attending).length;
    const declinados = responses.filter(r => !r.attending).length;
    const necesitanBus = responses.filter(r => r.attending && r.bus_option && r.bus_option !== 'no').length;

    const filteredResponses = responses.filter(r => {
        if (filter === 'yes') return r.attending;
        if (filter === 'no') return !r.attending;
        return true;
    });

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-wedding-bg flex flex-col items-center justify-center p-4">
                <div className="w-full max-w-sm bg-white rounded-2xl border p-8 text-center space-y-6">
                    <h2 className="font-serif text-2xl font-light">{weddingConfig.admin.title}</h2>
                    <form onSubmit={handlePasswordSubmit} className="space-y-4">
                        <input type="password" placeholder="Contraseña" value={passwordInput}
                               onChange={e => setPasswordInput(e.target.value)}
                               className="w-full border-b py-2 text-center outline-none focus:border-wedding-primary text-sm tracking-widest"/>
                        {passwordError && <p className="text-xs text-red-500">Contraseña incorrecta.</p>}
                        <button type="submit"
                                className="w-full px-6 py-2.5 bg-wedding-primary text-wedding-bg text-xs uppercase tracking-widest rounded-full font-semibold">Acceder
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-wedding-bg text-wedding-dark p-4 md:p-8">
            <div className="max-w-6xl mx-auto space-y-8">
                <header className="flex justify-between items-center border-b pb-4">
                    <div>
                        <h1 className="font-serif text-3xl font-light">{weddingConfig.admin.title}</h1>
                        <p className="text-xs text-wedding-primary/70">{weddingConfig.couple.displayNames}</p>
                    </div>
                    <button onClick={() => {
                        sessionStorage.removeItem('admin_authed');
                        setIsAuthenticated(false);
                    }} className="text-xs uppercase tracking-wider text-red-600 border px-4 py-1.5 rounded-full">Cerrar
                    </button>
                </header>

                <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white p-4 rounded-xl border text-center">
                        <span
                            className="text-xs uppercase text-wedding-primary/60 font-semibold block">Respuestas</span>
                        <span className="font-serif text-3xl font-light block mt-1">{totalRespuestas}</span>
                    </div>
                    <div className="bg-white p-4 rounded-xl border text-center">
                        <span className="text-xs uppercase text-green-600/70 font-semibold block">Asistirán</span>
                        <span className="font-serif text-3xl font-light text-green-700 block mt-1">{confirmados}</span>
                    </div>
                    <div className="bg-white p-4 rounded-xl border text-center">
                        <span className="text-xs uppercase text-red-600/70 font-semibold block">No Asistirán</span>
                        <span className="font-serif text-3xl font-light text-red-700 block mt-1">{declinados}</span>
                    </div>
                    <div className="bg-white p-4 rounded-xl border text-center">
                        <span className="text-xs uppercase text-wedding-primary/60 font-semibold block">Autobús</span>
                        <span className="font-serif text-3xl font-light block mt-1">{necesitanBus}</span>
                    </div>
                </section>

                <div className="flex gap-2">
                    <button onClick={() => setFilter('all')}
                            className={`px-4 py-1.5 rounded-full text-xs uppercase tracking-wider ${filter === 'all' ? 'bg-wedding-primary text-wedding-bg' : 'bg-white border'}`}>Todos
                    </button>
                    <button onClick={() => setFilter('yes')}
                            className={`px-4 py-1.5 rounded-full text-xs uppercase tracking-wider ${filter === 'yes' ? 'bg-green-700 text-white' : 'bg-white border'}`}>Confirmados
                    </button>
                    <button onClick={() => setFilter('no')}
                            className={`px-4 py-1.5 rounded-full text-xs uppercase tracking-wider ${filter === 'no' ? 'bg-red-700 text-white' : 'bg-white border'}`}>No
                        asisten
                    </button>
                </div>

                <main className="bg-white rounded-xl border overflow-hidden shadow-sm">
                    {loading ? (
                        <div className="p-12 text-center text-sm text-wedding-primary/60">Cargando...</div>
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
                                {filteredResponses.map((item) => (
                                    <tr key={item.id} className="hover:bg-wedding-bg/20">
                                        <td className="p-4 font-medium">{item.full_name}</td>
                                        <td className="p-4"><span
                                            className={`px-2 py-0.5 rounded-full text-xs ${item.attending ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{item.attending ? 'Sí' : 'No'}</span>
                                        </td>
                                        <td className="p-4 text-xs">{item.dietary_options.join(', ')} {item.dietary_other && `(${item.dietary_other})`}</td>
                                        <td className="p-4 text-xs capitalize">{item.bus_option?.replace('_', ' ') || '—'}</td>
                                        <td className="p-4 text-xs italic">{item.song_request || '—'}</td>
                                        <td className="p-4 text-xs text-wedding-primary/80">{item.message || '—'}</td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}
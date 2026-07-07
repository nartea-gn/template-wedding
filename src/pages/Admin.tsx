import {useState} from 'react';
import {weddingConfig} from '../config/wedding.config';
import {useAdminData} from '../hooks/useAdminData';
import {LoginForm} from '../components/admin/LoginForm';
import {StatsCards} from '../components/admin/StatsCards';
import {FilterBar} from '../components/admin/FilterBar';
import {ResponsesTable} from '../components/admin/ResponsesTable';

const ADMIN_AUTH_KEY = 'admin_authed';

export default function Admin() {
    const [isAuthenticated, setIsAuthenticated] = useState(
        () => sessionStorage.getItem(ADMIN_AUTH_KEY) === 'true'
    );
    const [passwordError, setPasswordError] = useState(false);
    const {
        loading,
        error,
        filter,
        setFilter,
        totalRespuestas,
        confirmados,
        declinados,
        necesitanBus,
        filteredResponses,
        refetch,
    } = useAdminData(isAuthenticated);

    const CORRECT_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD;
    const isConfigured = CORRECT_PASSWORD !== undefined;

    const handlePasswordSubmit = (password: string) => {
        if (password === CORRECT_PASSWORD) {
            setIsAuthenticated(true);
            setPasswordError(false);
            sessionStorage.setItem(ADMIN_AUTH_KEY, 'true');
        } else {
            setPasswordError(true);
        }
    };

    if (!isAuthenticated) {
        return (
            <LoginForm
                title={weddingConfig.admin.title}
                errorMessage={
                    passwordError
                        ? 'Contraseña incorrecta.'
                        : (!isConfigured ? 'Error de configuración: falta ADMIN_PASSWORD.' : null)
                }
                onSubmit={handlePasswordSubmit}
            />
        );
    }

    return (
        <div className="min-h-screen bg-wedding-bg text-wedding-dark p-4 md:p-8">
            <div className="max-w-6xl mx-auto space-y-8">
                <header className="flex justify-between items-center border-b pb-4">
                    <div>
                        <h1 className="font-serif text-3xl font-light">{weddingConfig.admin.title}</h1>
                        <p className="text-xs text-wedding-primary/70">{weddingConfig.partners.partner1} & {weddingConfig.partners.partner2}</p>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => refetch()}
                                className="text-xs uppercase tracking-wider text-wedding-primary border px-4 py-1.5 rounded-full">Refrescar
                        </button>
                        <button onClick={() => {
                            sessionStorage.removeItem(ADMIN_AUTH_KEY);
                            setIsAuthenticated(false);
                        }}
                                className="text-xs uppercase tracking-wider text-red-600 border px-4 py-1.5 rounded-full">Cerrar
                        </button>
                    </div>
                </header>

                <StatsCards
                    total={totalRespuestas}
                    confirmados={confirmados}
                    declinados={declinados}
                    necesitanBus={necesitanBus}
                />

                <FilterBar filter={filter} setFilter={setFilter}/>

                <ResponsesTable
                    responses={filteredResponses}
                    loading={loading}
                    error={error}
                />
            </div>
        </div>
    );
}

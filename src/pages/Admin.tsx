import {useState} from 'react';
import {weddingConfig} from '../config/wedding.config';
import {useAdminData} from '../hooks/useAdminData';
import {LoginForm} from '../components/admin/LoginForm';
import {StatsCards} from '../components/admin/StatsCards';
import {FilterBar} from '../components/admin/FilterBar';
import {ResponsesTable} from '../components/admin/ResponsesTable';
import './Admin.css';

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
        <div className="admin-page">
            <div className="admin-container">
                <header className="admin-header">
                    <div className="admin-title-block">
                        <h1 className="admin-title">
                            {weddingConfig.admin.title}
                        </h1>
                        <p className="admin-subtitle">
                            {weddingConfig.partners.partner1} & {weddingConfig.partners.partner2}
                        </p>
                    </div>
                    <div className="admin-actions">
                        <button
                            onClick={() => refetch()}
                            className="btn btn--outline admin-btn-refresh"
                        >
                            ↻ Refrescar
                        </button>
                        <button
                            onClick={() => {
                                sessionStorage.removeItem(ADMIN_AUTH_KEY);
                                setIsAuthenticated(false);
                            }}
                            className="btn btn--ghost admin-btn-logout"
                        >
                            Cerrar sesión
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

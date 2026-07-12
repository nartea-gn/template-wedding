import {useState} from 'react';
import {useAdminData} from '../hooks/useAdminData';
import {LoginForm} from '../components/admin/LoginForm';
import {StatsCards} from '../components/admin/StatsCards';
import {FilterBar} from '../components/admin/FilterBar';
import {ResponsesTable} from '../components/admin/ResponsesTable';
import './Admin.css';
import {useLocalization} from '../app/providers/useLocalization';
import {weddingInvitation, type WeddingMessageKey} from '../invitations/wedding';

const ADMIN_AUTH_KEY = 'admin_authed';

export default function Admin() {
    const {t} = useLocalization<WeddingMessageKey>();
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
    const rsvp = weddingInvitation.capabilities.rsvp;
    const admin = weddingInvitation.capabilities.admin;
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
                title={t('admin.title')}
                errorMessage={
                    passwordError
                        ? t('admin.password.invalid')
                        : (!isConfigured ? t('admin.password.missing') : null)
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
                            {t('admin.title')}
                        </h1>
                        <p className="admin-subtitle">
                            {t('hero.partnerOne')} & {t('hero.partnerTwo')}
                        </p>
                    </div>
                    <div className="admin-actions">
                        <button
                            onClick={() => refetch()}
                            className="btn btn--outline admin-btn-refresh"
                        >
                            ↻ {t('admin.refresh')}
                        </button>
                        <button
                            onClick={() => {
                                sessionStorage.removeItem(ADMIN_AUTH_KEY);
                                setIsAuthenticated(false);
                            }}
                            className="btn btn--ghost admin-btn-logout"
                        >
                            {t('admin.logout')}
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
                    form={rsvp!.form}
                    columns={admin!.columns}
                />
            </div>
        </div>
    );
}

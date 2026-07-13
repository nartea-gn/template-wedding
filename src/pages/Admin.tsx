import {useState} from 'react';
import {useAdminData} from '../hooks/useAdminData';
import {LoginForm} from '../components/admin/LoginForm';
import {StatsCards} from '../components/admin/StatsCards';
import {AdminToolbar} from '../components/admin/AdminToolbar';
import {PaginationControls} from '../components/admin/PaginationControls';
import {ResponsesTable} from '../components/admin/ResponsesTable';
import {useLocalization} from '../app/providers/useLocalization';
import {buildResponsesCsv} from '../features/admin/export/buildResponsesCsv';
import {downloadCsv} from '../features/admin/export/downloadCsv';
import {weddingInvitation, type WeddingMessageKey} from '../invitations/wedding';
import './Admin.css';

const ADMIN_AUTH_KEY = 'admin_authed';

export default function Admin() {
    const {t, locale, formatDate} = useLocalization<WeddingMessageKey>();
    const [isAuthenticated, setIsAuthenticated] = useState(
        () => sessionStorage.getItem(ADMIN_AUTH_KEY) === 'true'
    );
    const [passwordError, setPasswordError] = useState(false);
    const rsvp = weddingInvitation.capabilities.rsvp;
    const admin = weddingInvitation.capabilities.admin;
    const controls = admin?.controls;
    const {
        loading, hasError, lastUpdatedAt, filter, setFilter, query, setQuery, sortOrder, setSortOrder,
        totalResponses, attendingResponses, declinedResponses, transportResponses, resultCount,
        presentedResponses, paginatedResponses, currentPage, totalPages, pageSize, setPageSize, setPage, refetch,
    } = useAdminData(isAuthenticated, {
        locale,
        defaultSort: controls?.sorting?.default ?? 'newest',
        paginationEnabled: controls?.pagination?.enabled === true,
        pageSize: controls?.pagination?.pageSize ?? 25,
    });
    const correctPassword = import.meta.env.VITE_ADMIN_PASSWORD;
    const isConfigured = correctPassword !== undefined;

    if (!rsvp?.enabled || !admin?.enabled) return null;

    const handlePasswordSubmit = (password: string) => {
        if (password === correctPassword) {
            setIsAuthenticated(true);
            setPasswordError(false);
            sessionStorage.setItem(ADMIN_AUTH_KEY, 'true');
        } else {
            setPasswordError(true);
        }
    };

    const handleExport = () => {
        const csv = buildResponsesCsv({
            responses: presentedResponses,
            columns: admin.columns,
            form: rsvp.form,
            translate: t,
            booleanLabels: {yes: 'common.yes', no: 'common.no'},
        });
        downloadCsv(csv, weddingInvitation.id);
    };

    if (!isAuthenticated) {
        return <LoginForm title={t('admin.title')}
                          errorMessage={passwordError ? t('admin.password.invalid') : (!isConfigured ? t('admin.password.missing') : null)}
                          onSubmit={handlePasswordSubmit}/>;
    }

    return <div className="admin-page">
        <div className="admin-container">
            <header className="admin-header">
                <div className="admin-title-block">
                    <h1 className="admin-title">{t('admin.title')}</h1>
                    <p className="admin-subtitle">{t('hero.partnerOne')} & {t('hero.partnerTwo')}</p>
                </div>
                <div className="admin-action-block">
                    <div className="admin-actions">
                        <button onClick={() => refetch()} disabled={loading}
                                className="btn btn--outline admin-btn-refresh">
                            ↻ {t('admin.refresh')}
                        </button>
                        <button onClick={() => {
                            sessionStorage.removeItem(ADMIN_AUTH_KEY);
                            setIsAuthenticated(false);
                        }} className="btn btn--ghost admin-btn-logout">{t('admin.logout')}</button>
                    </div>
                    {controls?.freshness?.enabled && lastUpdatedAt && <p className="admin-freshness" role="status">
                        {t('admin.updated')} {formatDate(lastUpdatedAt, {dateStyle: 'short', timeStyle: 'medium'})}
                    </p>}
                </div>
            </header>

            <StatsCards total={totalResponses} confirmados={attendingResponses} declinados={declinedResponses}
                        necesitanBus={transportResponses}/>

            <AdminToolbar controls={controls} filter={filter} setFilter={setFilter} query={query} setQuery={setQuery}
                          sortOrder={sortOrder} setSortOrder={setSortOrder} resultCount={resultCount}
                          totalResponses={totalResponses} pageSize={pageSize} setPageSize={setPageSize}
                          exportDisabled={loading || resultCount === 0}
                          onExport={handleExport}/>

            <ResponsesTable responses={paginatedResponses} loading={loading} hasError={hasError} form={rsvp.form}
                            columns={admin.columns} onRetry={() => refetch()}/>

            {controls?.pagination?.enabled && <PaginationControls currentPage={currentPage} totalPages={totalPages}
                                                                  onPageChange={setPage}/>}
        </div>
    </div>;
}

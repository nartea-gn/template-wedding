import {useAdminData} from '../hooks/useAdminData';
import {useAdminSession} from '../hooks/useAdminSession';
import {LoginForm} from '../components/admin/LoginForm';
import {StatsCards} from '../components/admin/StatsCards';
import {AdminToolbar} from '../components/admin/AdminToolbar';
import {PaginationControls} from '../components/admin/PaginationControls';
import {ResponsesTable} from '../components/admin/ResponsesTable';
import {RsvpClosureControl} from '../components/admin/RsvpClosureControl';
import {useLocalization} from '../app/providers/useLocalization';
import {buildResponsesCsv} from '../features/admin/export/buildResponsesCsv';
import {downloadCsv} from '../features/admin/export/downloadCsv';
import {weddingInvitation, type WeddingMessageKey} from '../invitations/wedding';
import type {AdminAuthDefinition, AdminAuthMethod} from '../core/invitation/types';
import {InterfaceIcon} from '../components/ui/InterfaceIcon';
import './Admin.css';

/**
 * Resolves the sign-in method for the panel.
 *
 * The return type is annotated on purpose: it keeps both branches of the login screen
 * reachable when an invitation pins a single literal method in its definition.
 */
function resolveAuthMethod(auth: AdminAuthDefinition | undefined): AdminAuthMethod {
    return auth?.method ?? 'otp';
}

export default function Admin() {
    const {t, locale, formatDate} = useLocalization<WeddingMessageKey>();
    const rsvp = weddingInvitation.capabilities.rsvp;
    const admin = weddingInvitation.capabilities.admin;
    const authMethod = resolveAuthMethod(admin?.auth);
    const auth = useAdminSession(authMethod);
    const isAuthenticated = auth.session !== null;
    const controls = admin?.controls;
    const {
        loading, hasError, errorMessage, actionMessage, lastUpdatedAt, filter, setFilter, query, setQuery, sortOrder, setSortOrder,
        totalResponses, attendingResponses, declinedResponses, transportResponses, resultCount,
        presentedResponses, paginatedResponses, currentPage, totalPages, pageSize, setPageSize, setPage, refetch,
        updateResponse, deleteResponse, restoreResponse, rsvpStatus, updateSchedule, rowError,
    } = useAdminData(isAuthenticated, {
        locale,
        defaultSort: controls?.sorting?.default ?? 'newest',
        paginationEnabled: controls?.pagination?.enabled === true,
        pageSize: controls?.pagination?.pageSize ?? 25,
    });
    if (!rsvp?.enabled || !admin?.enabled) return null;

    const handleExportCsv = () => {
        const csv = buildResponsesCsv({
            responses: presentedResponses,
            columns: admin.columns,
            form: rsvp.form,
            translate: t,
            booleanLabels: {yes: 'common.yes', no: 'common.no'},
        });
        downloadCsv(csv, weddingInvitation.id);
    };

    if (auth.phase === 'loading') {
        return <div className="admin-auth-loading" role="status" aria-live="polite">
            <span className="admin-auth-loading-indicator" aria-hidden="true"/>
            <span>{t('admin.auth.restoring')}</span>
        </div>;
    }

    if (!isAuthenticated && authMethod === 'password' && auth.phase === 'password') {
        return <LoginForm title={t('admin.title')}
                          method="password"
                          error={auth.error}
                          submitting={auth.submitting}
                          onAuthenticate={auth.authenticateWithPassword}/>;
    }

    if (!isAuthenticated && authMethod === 'otp' && (auth.phase === 'email' || auth.phase === 'code')) {
        return <LoginForm title={t('admin.title')}
                          method="otp"
                          phase={auth.phase}
                          requestedEmail={auth.email}
                          error={auth.error}
                          submitting={auth.submitting}
                          onRequestCode={auth.requestCode}
                          onVerifyCode={auth.verifyCode}
                          onChangeEmail={auth.changeEmail}/>;
    }

    return <div className="admin-page">
        <div className="admin-container" aria-busy={loading}>
            <header className="admin-header">
                <div className="admin-title-block">
                    <h1 className="admin-title">{t('admin.title')}</h1>
                    <p className="admin-subtitle">{t('hero.partnerOne')} & {t('hero.partnerTwo')}</p>
                </div>
                <div className="admin-action-block">
                    <div className="admin-actions">
                        <button onClick={() => refetch()} disabled={loading}
                                className="btn btn--outline admin-btn-refresh">
                            <InterfaceIcon name="refresh" className="admin-action-icon"/> {t('admin.refresh')}
                        </button>
                        <button onClick={() => void auth.signOut()} disabled={auth.submitting}
                                className="btn btn--ghost admin-btn-logout">
                            {auth.submitting ? t('admin.auth.signingOut') : t('admin.logout')}
                        </button>
                    </div>
                    {controls?.freshness?.enabled && lastUpdatedAt && <p className="admin-freshness" role="status">
                        {t('admin.updated')} {formatDate(lastUpdatedAt, {dateStyle: 'short', timeStyle: 'medium'})}
                    </p>}
                    {auth.error === 'session' && <p className="admin-session-error" role="alert">
                        {t('admin.auth.sessionError')}
                    </p>}
                    {actionMessage && <p className="admin-action-message" role="status" aria-live="polite">
                        {t(actionMessage)}
                    </p>}
                    <p className="admin-security-note">{t('admin.auth.sharedDevice')}</p>
                </div>
            </header>

            <p className="admin-data-notice" role="note">{t('admin.dataNotice')}</p>

            {admin.mutations?.rsvpClosure?.enabled && (
                <RsvpClosureControl status={rsvpStatus} saving={loading} onSave={updateSchedule}/>
            )}

            <StatsCards total={totalResponses} confirmados={attendingResponses} declinados={declinedResponses}
                        necesitanBus={transportResponses}/>

            <AdminToolbar controls={controls} filter={filter} setFilter={setFilter} query={query} setQuery={setQuery}
                          sortOrder={sortOrder} setSortOrder={setSortOrder} resultCount={resultCount}
                          totalResponses={totalResponses} pageSize={pageSize} setPageSize={setPageSize}
                          exportDisabled={loading || resultCount === 0}
                          onExport={handleExportCsv}/>

            <ResponsesTable responses={paginatedResponses} loading={loading} hasError={hasError} errorMessage={errorMessage} form={rsvp.form}
                            columns={admin.columns} onRetry={() => refetch()}
                            onUpdate={updateResponse} onDelete={deleteResponse} onRestore={restoreResponse}
                            rowError={rowError}/>

            {controls?.pagination?.enabled && <PaginationControls currentPage={currentPage} totalPages={totalPages}
                                                                   onPageChange={setPage}/>}
        </div>
    </div>;
}

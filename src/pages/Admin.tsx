import {useAdminData} from '../hooks/useAdminData';
import {useAdminSession} from '../hooks/useAdminSession';
import {LoginForm} from '../components/admin/LoginForm';
import {StatsCards, type Stat} from '../components/admin/StatsCards';
import {StatsBreakdown} from '../components/admin/StatsBreakdown';
import type {AdminFilter} from '../features/admin/presentation/getPresentedResponses';
import {weddingRsvpForm} from '../invitations/wedding/rsvpForm';
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

/**
 * Un grupo de filtro por cada reparto declarado, con sus opciones tal y como las leyo el invitado.
 *
 * Se deriva del formulario y no de los valores guardados, igual que el recuento: asi el orden es el
 * de la pregunta y una opcion que nadie ha elegido sigue apareciendo, para poder comprobar que no
 * hay nadie en ella.
 */
function choiceFilterGroups(fieldIds: readonly string[], translate: (key: WeddingMessageKey) => string) {
    const fields = new Map(weddingRsvpForm.steps.flatMap(step => step.elements).map(element => [element.id, element]));
    return fieldIds.flatMap(fieldId => {
        const field = fields.get(fieldId);
        if (!field || !('options' in field)) return [];
        return [{
            groupLabel: translate(field.label as WeddingMessageKey),
            options: field.options.map(option => ({
                value: `choice:${fieldId}:${String(option.value)}` as AdminFilter,
                label: translate(option.label as WeddingMessageKey),
            })),
        }];
    });
}

/**
 * Las tarjetas de cabecera que esta invitacion puede rellenar de verdad.
 *
 * Las tres primeras existen siempre. La del autobus solo si hay `transportFieldId`: sin el,
 * `needsTransport` devuelve `false` para todo el mundo y la tarjeta marcaba un cero permanente
 * para una pregunta que esa boda no hace. Misma regla que la columna, el filtro y el reparto.
 */
function headlineStats(
    metrics: {transportFieldId?: string},
    counts: {total: number; attending: number; declined: number; transport: number},
): Stat[] {
    return [
        {label: 'admin.stats.responses', value: counts.total, tone: 'default', icon: 'clipboard'},
        {label: 'admin.stats.attending', value: counts.attending, tone: 'green', icon: 'heart'},
        {label: 'admin.stats.declined', value: counts.declined, tone: 'red', icon: 'heart-broken'},
        ...(metrics.transportFieldId
            ? [{label: 'admin.stats.bus', value: counts.transport, tone: 'default', icon: 'bus'} as Stat]
            : []),
    ];
}

/**
 * Las vistas fijas que esta invitacion puede ofrecer de verdad.
 *
 * `all`, `confirmed` y `declined` existen siempre; `bus` y `dietary` solo si la metrica que las
 * alimenta esta declarada. Se lee de `metrics` y no de `weddingRsvpSections` a proposito: es el
 * panel el que decide que puede contar, y la seccion ya gobierna lo que entra en `metrics`.
 */
function sectionFilters(metrics: {transportFieldId?: string; dietaryFieldIds?: readonly string[]}): AdminFilter[] {
    return [
        'all', 'confirmed', 'declined',
        ...(metrics.transportFieldId ? ['bus' as const] : []),
        ...(metrics.dietaryFieldIds?.length ? ['dietary' as const] : []),
    ];
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
        totalResponses, attendingResponses, declinedResponses, transportResponses, breakdowns, resultCount,
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
            columns: controls?.csvExport?.columns ?? admin.columns,
            columnLabels: admin.columnLabels,
            valueLabels: controls?.csvExport?.valueLabels,
            form: rsvp.form,
            translate: t,
            booleanLabels: {yes: 'common.yes', no: 'common.no'},
        });
        downloadCsv(csv, weddingInvitation.id, new Date(), filter);
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
                            <InterfaceIcon name="refresh" className="admin-action-icon"/>
                            {t('admin.refresh')}
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

            <StatsCards stats={headlineStats(admin.metrics, {
                total: totalResponses, attending: attendingResponses,
                declined: declinedResponses, transport: transportResponses,
            })}/>
            <StatsBreakdown breakdowns={breakdowns} form={weddingRsvpForm} labels={admin.breakdownLabels}/>

            <AdminToolbar controls={controls} filter={filter} setFilter={setFilter} query={query} setQuery={setQuery}
                          sectionFilters={sectionFilters(admin.metrics)}
                          choiceFilters={choiceFilterGroups(breakdowns.map(b => b.fieldId), t)}
                          sortOrder={sortOrder} setSortOrder={setSortOrder} resultCount={resultCount}
                          totalResponses={totalResponses} pageSize={pageSize} setPageSize={setPageSize}
                          exportDisabled={loading || resultCount === 0}
                          onExport={handleExportCsv}/>

            <ResponsesTable responses={paginatedResponses} loading={loading} hasError={hasError} errorMessage={errorMessage} form={rsvp.form}
                            columns={admin.columns} columnLabels={admin.columnLabels} onRetry={() => refetch()}
                            onUpdate={updateResponse} onDelete={deleteResponse} onRestore={restoreResponse}
                            rowError={rowError}
                            isFiltered={filter !== 'all' || query.trim() !== ''}
                            onClearFilters={() => {
                                setFilter('all')
                                setQuery('')
                            }}/>

            {controls?.pagination?.enabled && <PaginationControls currentPage={currentPage} totalPages={totalPages}
                                                                   onPageChange={setPage}
                                                                   scrollTargetId="admin-responses"/>}

            {/* Al final a proposito: es el control que la pareja toca una vez, y arriba se comia
                nueve de las diecinueve paradas de tabulacion que habia antes de los datos. */}
            {admin.mutations?.rsvpClosure?.enabled && (
                <div className="admin-closure-tail">
                    <RsvpClosureControl status={rsvpStatus} onSave={updateSchedule}/>
                </div>
            )}
        </div>
    </div>;
}

import type {AdminReadControls, AdminSortOrder} from '../../core/invitation';
import type {AdminFilter} from '../../hooks/useAdminData';
import {useLocalization} from '../../app/providers/useLocalization';
import type {WeddingMessageKey} from '../../invitations/wedding';
import './AdminToolbar.css';

type Props = {
    controls: AdminReadControls | undefined; filter: AdminFilter; setFilter: (value: AdminFilter) => void;
    query: string; setQuery: (value: string) => void; sortOrder: AdminSortOrder;
    setSortOrder: (value: AdminSortOrder) => void; resultCount: number; totalResponses: number;
    pageSize: number; setPageSize: (value: number) => void; exportDisabled: boolean; onExport: () => void;
};

export function AdminToolbar({controls, filter, setFilter, query, setQuery, sortOrder, setSortOrder,
                                 resultCount, totalResponses, pageSize, setPageSize, exportDisabled, onExport}: Props) {
    const {t} = useLocalization<WeddingMessageKey>();
    const pageSizeSelector = controls?.pagination?.pageSizeSelector;
    const pageSizeOptions = controls?.pagination?.enabled && pageSizeSelector?.enabled
        ? pageSizeSelector.options
        : undefined;
    return <section className="admin-toolbar" aria-label={t('admin.controls.label')}>
        <div className="admin-toolbar-fields">
            <div className="admin-toolbar-field">
                <label htmlFor="admin-response-filter" className="label admin-toolbar-label">{t('admin.filter.label')}</label>
                <select id="admin-response-filter" value={filter}
                        onChange={event => setFilter(event.target.value as AdminFilter)} className="input admin-toolbar-select">
                    <option value="all">{t('admin.filter.all')}</option>
                    <option value="confirmed">{t('admin.filter.confirmed')}</option>
                    <option value="declined">{t('admin.filter.declined')}</option>
                    <option value="bus">{t('admin.filter.bus')}</option>
                </select>
            </div>
            {controls?.search?.enabled && <div className="admin-toolbar-field admin-toolbar-field--search">
                <label htmlFor="admin-response-search" className="label admin-toolbar-label">{t('admin.search.label')}</label>
                <input id="admin-response-search" type="search" value={query}
                       onChange={event => setQuery(event.target.value)} placeholder={t('admin.search.placeholder')}
                       className="input admin-toolbar-input"/>
            </div>}
            {controls?.sorting?.enabled && <div className="admin-toolbar-field">
                <label htmlFor="admin-response-sort" className="label admin-toolbar-label">{t('admin.sort.label')}</label>
                <select id="admin-response-sort" value={sortOrder}
                        onChange={event => setSortOrder(event.target.value as AdminSortOrder)} className="input admin-toolbar-select">
                    <option value="newest">{t('admin.sort.newest')}</option>
                    <option value="oldest">{t('admin.sort.oldest')}</option>
                    <option value="identity-asc">{t('admin.sort.identityAsc')}</option>
                    <option value="identity-desc">{t('admin.sort.identityDesc')}</option>
                </select>
            </div>}
            {controls?.csvExport?.enabled && <button type="button" className="btn btn--outline admin-toolbar-export"
                                                     disabled={exportDisabled} onClick={onExport}>
                {t('admin.export.csv')}
            </button>}
        </div>
        {(controls?.resultCount?.enabled || pageSizeOptions) && <div className="admin-toolbar-summary">
            {controls?.resultCount?.enabled && <p className="admin-toolbar-results" role="status" aria-live="polite">
                {t('admin.results.label')} {resultCount} {t('admin.results.of')} {totalResponses}
            </p>}
            {pageSizeOptions && <div className="admin-toolbar-page-size">
                <label htmlFor="admin-page-size" className="admin-toolbar-page-size-label">
                    {t('admin.pagination.pageSize')}
                </label>
                <select id="admin-page-size" value={pageSize}
                        onChange={event => setPageSize(Number(event.target.value))}
                        className="input admin-toolbar-page-size-select">
                    {pageSizeOptions.map(option => <option key={option} value={option}>{option}</option>)}
                </select>
            </div>}
        </div>}
    </section>;
}

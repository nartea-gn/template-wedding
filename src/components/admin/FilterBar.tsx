import type {Filter} from '../../hooks/useAdminData';
import './FilterBar.css';
import {useLocalization} from '../../app/providers/useLocalization';
import type {WeddingMessageKey} from '../../invitations/wedding';

type FilterBarProps = {
    filter: Filter;
    setFilter: (value: Filter) => void;
};

export function FilterBar({filter, setFilter}: FilterBarProps) {
    const {t} = useLocalization<WeddingMessageKey>();
    return (
        <div className="filter-bar">
            <div className="filter-group">
                <label className="label filter-label">{t('admin.filter.label')}</label>
                <select
                    value={filter}
                    onChange={e => setFilter(e.target.value as Filter)}
                    className="input filter-select"
                >
                    <option value="all">{t('admin.filter.all')}</option>
                    <option value="confirmed">{t('admin.filter.confirmed')}</option>
                    <option value="declined">{t('admin.filter.declined')}</option>
                    <option value="bus">{t('admin.filter.bus')}</option>
                </select>
            </div>
        </div>
    );
}

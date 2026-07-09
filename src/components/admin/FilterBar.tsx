import type {Filter} from '../../hooks/useAdminData';
import './FilterBar.css';

type FilterBarProps = {
    filter: Filter;
    setFilter: (value: Filter) => void;
};

export function FilterBar({filter, setFilter}: FilterBarProps) {
    return (
        <div className="filter-bar">
            <div className="filter-group">
                <label className="filter-label">Filtrar:</label>
                <select
                    value={filter}
                    onChange={e => setFilter(e.target.value)}
                    className="filter-select"
                >
                    <option value="all">Todos</option>
                    <option value="confirmed">Confirmados</option>
                    <option value="declined">Declinados</option>
                    <option value="bus">Necesitan bus</option>
                </select>
            </div>
        </div>
    );
}

import type {Filter} from '../../hooks/useAdminData';

type FilterBarProps = {
    filter: Filter;
    setFilter: (filter: Filter) => void;
};

const FILTERS: { key: Filter; label: string; activeClass: string }[] = [
    {key: 'all', label: 'Todos', activeClass: 'bg-wedding-primary text-wedding-bg'},
    {key: 'yes', label: 'Confirmados', activeClass: 'bg-green-700 text-white'},
    {key: 'no', label: 'No asisten', activeClass: 'bg-red-700 text-white'},
];

export function FilterBar({filter, setFilter}: FilterBarProps) {
    return (
        <div className="flex gap-2">
            {FILTERS.map(({key, label, activeClass}) => (
                <button key={key} onClick={() => setFilter(key)}
                        className={`px-4 py-1.5 rounded-full text-xs uppercase tracking-wider ${filter === key ? activeClass : 'bg-white border'}`}>{label}
                </button>
            ))}
        </div>
    );
}

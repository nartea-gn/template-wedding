import './StatsCards.css';

type StatsCardsProps = {
    total: number;
    confirmados: number;
    declinados: number;
    necesitanBus: number;
};

type Tone = 'default' | 'green' | 'red';

type Stat = {
    label: string;
    value: number;
    tone: Tone;
    icon?: string;
};

export function StatsCards({total, confirmados, declinados, necesitanBus}: StatsCardsProps) {
    const stats: Stat[] = [
        {label: 'Respuestas', value: total, tone: 'default', icon: '📋'},
        {label: 'Asistirán', value: confirmados, tone: 'green', icon: '💚'},
        {label: 'No Asistirán', value: declinados, tone: 'red', icon: '💔'},
        {label: 'Autobús', value: necesitanBus, tone: 'default', icon: '🚌'},
    ];

    return (
        <section className="stats-grid">
            {stats.map(({label, value, tone, icon}) => (
                    <div
                        key={label}
                        className="card stat-card"
                    >
                    <span className="stat-icon">{icon}</span>
                    <span className={`stat-label stat-label--${tone}`}>
                        {label}
                    </span>
                    <span className={`stat-value stat-value--${tone}`}>
                        {value}
                    </span>
                </div>
            ))}
        </section>
    );
}

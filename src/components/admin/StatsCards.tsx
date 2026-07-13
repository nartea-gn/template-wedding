import './StatsCards.css';
import {useLocalization} from '../../app/providers/useLocalization';
import type {WeddingMessageKey} from '../../invitations/wedding';

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
    const {t} = useLocalization<WeddingMessageKey>();
    const stats: Stat[] = [
        {label: t('admin.stats.responses'), value: total, tone: 'default', icon: '📋'},
        {label: t('admin.stats.attending'), value: confirmados, tone: 'green', icon: '💚'},
        {label: t('admin.stats.declined'), value: declinados, tone: 'red', icon: '💔'},
        {label: t('admin.stats.bus'), value: necesitanBus, tone: 'default', icon: '🚌'},
    ];

    return (
        <section className="stats-grid" aria-label={t('admin.stats.label')}>
            {stats.map(({label, value, tone, icon}) => (
                <div
                    key={label}
                    className="card stat-card"
                >
                    <span className="stat-icon" aria-hidden="true">{icon}</span>
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

import './StatsCards.css';
import {useLocalization} from '../../app/providers/useLocalization';
import type {WeddingMessageKey} from '../../invitations/wedding';
import {InterfaceIcon} from '../ui/InterfaceIcon';

export type StatTone = 'default' | 'green' | 'red';

export type Stat = {
    /** Clave del catalogo, no el texto ya traducido: la tarjeta sigue al idioma activo. */
    label: WeddingMessageKey;
    value: number;
    tone: StatTone;
    icon: string;
};

type StatsCardsProps = {
    stats: readonly Stat[];
};

/**
 * Los numeros de cabecera del panel.
 *
 * Recibe la lista en vez de un parametro por tarjeta. Con cuatro props fijas -- uno de ellos
 * llamado `necesitanBus` -- una boda sin autobus seguia viendo su tarjeta, marcando cero para una
 * pregunta que nunca se hizo, y la unica forma de anadir una quinta metrica era anadir un prop mas
 * a un componente que ya no daba mas de si.
 *
 * Quien decide que se cuenta es `metrics` en la definicion de invitacion, que es donde ya vive esa
 * decision para las columnas, los filtros y el reparto.
 */
export function StatsCards({stats}: Readonly<StatsCardsProps>) {
    const {t} = useLocalization<WeddingMessageKey>();

    return (
        <section className="stats-grid" aria-label={t('admin.stats.label')}>
            {stats.map(({label, value, tone, icon}) => (
                <div key={label} className="card stat-card">
                    <InterfaceIcon name={icon} className={`stat-icon stat-icon--${tone}`}/>
                    <span className={`stat-label stat-label--${tone}`}>
                        {t(label)}
                    </span>
                    <span className={`stat-value stat-value--${tone}`}>
                        {value}
                    </span>
                </div>
            ))}
        </section>
    );
}

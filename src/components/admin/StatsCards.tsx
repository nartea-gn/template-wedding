type StatsCardsProps = {
    total: number;
    confirmados: number;
    declinados: number;
    necesitanBus: number;
};

type Stat = {
    label: string;
    value: number;
    labelClass: string;
    valueClass?: string;
};

export function StatsCards({total, confirmados, declinados, necesitanBus}: StatsCardsProps) {
    const stats: Stat[] = [
        {label: 'Respuestas', value: total, labelClass: 'text-wedding-primary/60'},
        {label: 'Asistirán', value: confirmados, labelClass: 'text-green-600/70', valueClass: 'text-green-700'},
        {label: 'No Asistirán', value: declinados, labelClass: 'text-red-600/70', valueClass: 'text-red-700'},
        {label: 'Autobús', value: necesitanBus, labelClass: 'text-wedding-primary/60'},
    ];

    return (
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map(({label, value, labelClass, valueClass}) => (
                <div key={label} className="bg-white p-4 rounded-xl border text-center">
                    <span className={`text-xs uppercase ${labelClass} font-semibold block`}>{label}</span>
                    <span className={`font-serif text-3xl font-light ${valueClass ?? ''} block mt-1`}>{value}</span>
                </div>
            ))}
        </section>
    );
}

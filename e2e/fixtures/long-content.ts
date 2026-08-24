export const longContentByLocale = {
    es: {
        title: 'Alejandra de los Ángeles & Maximiliano Fernández de Villavicencio',
        subtitle: 'Queremos compartir contigo una celebración llena de historias, abrazos y momentos inolvidables',
        venue: 'Palacio Histórico de Nuestra Señora de los Jardines del Mediterráneo',
        address: 'Avenida de la Ilustración y las Artes, número 128, acceso por los jardines centrales, Madrid',
        cta: 'Confirmar asistencia a nuestra celebración',
        rsvpTitle: 'Confirmación de asistencia a la celebración',
        rsvpLabel: 'Nombre y apellidos de todas las personas incluidas en la respuesta *',
        rsvpOption: 'Sí, asistiré y compartiré este día tan especial con vosotros',
    },
    en: {
        title: 'Alexandria Montgomery-Wellington & Maximilian Fernández de Villavicencio',
        subtitle: 'We would love to share a celebration filled with stories, embraces and unforgettable moments',
        venue: 'The Historic Palace of Our Lady of the Mediterranean Gardens',
        address: '128 Avenue of Illustration and the Arts, entrance through the central gardens, Madrid',
        cta: 'Confirm attendance at our wedding celebration',
        rsvpTitle: 'Attendance confirmation for the wedding celebration',
        rsvpLabel: 'Full names of every person included in this response *',
        rsvpOption: 'Yes, I will attend and share this very special day with you',
    },
    bg: {
        title: 'Александра Константинова-Монтгомъри & Максимилиан Фернандес де Вилявисенсио',
        subtitle: 'Ще се радваме да споделим с вас празник, изпълнен с истории, прегръдки и незабравими мигове',
        venue: 'Исторически дворец на Дева Мария от средиземноморските градини',
        address: 'Булевард на илюстрацията и изкуствата 128, вход през централните градини, Мадрид',
        cta: 'Потвърдете присъствието си на нашето сватбено тържество',
        rsvpTitle: 'Потвърждение за присъствие на сватбеното тържество',
        rsvpLabel: 'Пълните имена на всички лица, включени в този отговор *',
        rsvpOption: 'Да, ще присъствам и ще споделя този специален ден с вас',
    },
} as const

export type LongContentLocale = keyof typeof longContentByLocale

export interface WeddingConfig {
    couple: {
        brideName: string;
        groomName: string;
        displayNames: string;
    };
    event: {
        slug: string;
        date: string;
        time: string;
        venue: string;
        city: string;
    };
    invitation: {
        title: string;
        subtitle: string;
        rsvpButtonText: string;
    };
    admin: {
        title: string;
    };
    theme: 'royal' | 'boho' | 'dark' | 'magnolia' | 'linen';
}

export const weddingConfig: WeddingConfig = {
    couple: {
        brideName: "Gala",
        groomName: "Valentin",
        displayNames: "Gala & Valentin",
    },
    event: {
        slug: "gala-y-valentin",
        date: "2027-06-12",
        time: "18:00",
        venue: "Finca / Lugar de celebración",
        city: "Ciudad",
    },
    invitation: {
        title: "Nos casamos",
        subtitle: "Queremos compartir este día contigo",
        rsvpButtonText: "Confirmar asistencia",
    },
    admin: {
        title: "Respuestas RSVP",
    },
    theme: 'linen',
};

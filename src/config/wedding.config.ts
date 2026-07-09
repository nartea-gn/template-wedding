type VenueItem = {
    name: string
    time?: string
    address?: string
    mapsQuery?: string
}

export interface WeddingConfig {
    partners: { partner1: string; partner2: string }
    date: string
    venue: { ceremony: VenueItem; reception: VenueItem }
    rsvpDeadline: string
    hashtag: string
    showVenue: boolean
    showCountdown: boolean
    slug: string
    theme: 'royal' | 'boho' | 'dark' | 'magnolia' | 'linen';
    invitation: {
        title: string;
        subtitle: string;
        rsvpButtonText: string;
    };
    admin: {
        title: string;
    };
}

export const weddingConfig: WeddingConfig = {
    partners: {
        partner1: "Gala",
        partner2: "Valentin",
    },
    date: "2027-06-12",
    venue: {
        ceremony: {
            name: 'Iglesia de San Pedro',
            time: '12:00',
            address: 'Calle Mayor, 1, Madrid',
            mapsQuery: 'C. del Nuncio, 14, Centro, 28005 Madrid',
        },
        reception: {
            name: 'Finca La Rosaleda',
            time: '14:00',
            address: 'Finca La Rosaleda, Madrid',
            mapsQuery: 'P.º de Fernán Núñez, 4, Retiro, 28009 Madrid',
        },
    },
    rsvpDeadline: "2027-05-12",
    hashtag: "#BodaGalaYValentin",
    showVenue: true,
    showCountdown: true,
    slug: "gala-y-valentin",
    invitation: {
        title: "Nos casamos",
        subtitle: "Queremos compartir este día contigo",
        rsvpButtonText: "Confirmar asistencia",
    },
    admin: {
        title: "Respuestas RSVP",
    },
    theme: 'royal',
};

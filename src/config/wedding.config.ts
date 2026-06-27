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
        videoFileName: string;
        rsvpButtonText: string;
    };
    admin: {
        title: string;
    };
}

export const weddingConfig: WeddingConfig = {
    couple: {
        brideName: "Nombre Novia",
        groomName: "Nombre Novio",
        displayNames: "Nombre Novia & Nombre Novio",
    },
    event: {
        slug: "maria-y-juan",
        date: "2027-06-12",
        time: "18:00",
        venue: "Finca / Lugar de celebración",
        city: "Ciudad",
    },
    invitation: {
        title: "Nos casamos",
        subtitle: "Queremos compartir este día contigo",
        videoFileName: "video-boda.mp4",
        rsvpButtonText: "Confirmar asistencia",
    },
    admin: {
        title: "Respuestas RSVP",
    },
};
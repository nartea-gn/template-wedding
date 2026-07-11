import type {MessageCatalog, MessageKey} from '../../../core/localization'

export const esMessages = {
    'event.title': 'Nos casamos',
    'event.seoTitle': 'Invitación de boda de Gala y Valentin',
    'event.seoDescription': 'Acompáñanos a celebrar nuestro gran día.',
    'hero.partnerOne': 'Gala',
    'hero.partnerTwo': 'Valentin',
    'hero.subtitle': 'Queremos compartir este día contigo',
    'countdown.label': 'Falta para el gran día',
    'venue.label': 'La celebración',
    'venue.ceremony.type': 'Ceremonia',
    'venue.ceremony.name': 'Iglesia de San Pedro',
    'venue.ceremony.address': 'Calle Mayor, 1, Madrid',
    'venue.reception.type': 'Recepción',
    'venue.reception.name': 'Finca La Rosaleda',
    'venue.reception.address': 'Finca La Rosaleda, Madrid',
    'rsvp.cta': 'Confirmar asistencia',
    'admin.title': 'Respuestas RSVP',
} as const satisfies MessageCatalog

export type WeddingMessageKey = MessageKey<typeof esMessages>


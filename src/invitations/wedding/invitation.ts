import type {InvitationDefinition} from '../../core/invitation'
import {validateInvitationDefinition} from '../../core/invitation'
import type {WeddingMessageKey} from './locales/es'

export const weddingInvitation = {
    id: 'gala-y-valentin',
    event: {
        type: 'wedding',
        title: 'event.title',
        date: '2027-06-12',
        timezone: 'Europe/Madrid',
        hashtag: '#BodaGalaYValentin',
    },
    theme: {
        id: 'royal',
    },
    seo: {
        title: 'event.seoTitle',
        description: 'event.seoDescription',
    },
    localization: {
        defaultLocale: 'es',
        supportedLocales: ['es'],
        selector: {
            visible: false,
        },
    },
    sections: [
        {
            id: 'hero',
            type: 'hero',
            enabled: true,
            content: {
                partnerOne: 'hero.partnerOne',
                partnerTwo: 'hero.partnerTwo',
                subtitle: 'hero.subtitle',
            },
        },
        {
            id: 'countdown',
            type: 'countdown',
            enabled: true,
            content: {
                label: 'countdown.label',
                target: '2027-06-12T12:00:00+02:00',
            },
        },
        {
            id: 'video',
            type: 'video',
            enabled: true,
            content: {
                assetId: 'wedding-hero-video',
            },
        },
        {
            id: 'venue',
            type: 'venue',
            enabled: true,
            content: {
                label: 'venue.label',
                items: [
                    {
                        id: 'ceremony',
                        typeLabel: 'venue.ceremony.type',
                        name: 'venue.ceremony.name',
                        time: '12:00',
                        address: 'venue.ceremony.address',
                        mapsQuery: 'C. del Nuncio, 14, Centro, 28005 Madrid',
                    },
                    {
                        id: 'reception',
                        typeLabel: 'venue.reception.type',
                        name: 'venue.reception.name',
                        time: '14:00',
                        address: 'venue.reception.address',
                        mapsQuery: 'P.º de Fernán Núñez, 4, Retiro, 28009 Madrid',
                    },
                ],
            },
        },
        {
            id: 'rsvp-cta',
            type: 'rsvp-cta',
            enabled: true,
            content: {
                label: 'rsvp.cta',
            },
        },
    ],
    capabilities: {
        rsvp: {
            enabled: true,
            deadline: '2027-05-12',
        },
        admin: {
            enabled: true,
            source: 'rsvp',
        },
    },
} as const satisfies InvitationDefinition<'es', WeddingMessageKey>

const definitionErrors = validateInvitationDefinition(weddingInvitation)
if (definitionErrors.length > 0) {
    throw new Error(`Invalid wedding invitation: ${definitionErrors.join('; ')}`)
}


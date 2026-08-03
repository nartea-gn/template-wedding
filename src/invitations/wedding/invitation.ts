import type {InvitationDefinition} from '../../core/invitation'
import {validateInvitationDefinition} from '../../core/invitation'
import type {WeddingMessageKey} from './locales/es'
import type {WeddingLocale} from './locales/types'
import {weddingRsvpForm} from './rsvpForm'

export const weddingInvitation = {
    id: 'gala-y-valentin',
    event: {
        type: 'wedding',
        title: 'event.title',
        date: '2027-06-12T12:00:00+02:00',
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
        supportedLocales: ['es', 'en', 'bg'],
        selector: {
            visible: true,
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
                unitLabels: {
                    days: 'countdown.days',
                    hours: 'countdown.hours',
                    minutes: 'countdown.minutes',
                    seconds: 'countdown.seconds'
                },
            },
        },
        {
            id: 'video',
            type: 'video',
            enabled: true,
            content: {
                assetId: 'wedding-hero-video',
                posterAssetId: 'wedding-hero-video-poster',
                preload: 'none',
                aspectRatio: '9 / 16',
                label: 'video.label',
                playLabel: 'video.play',
                loadingLabel: 'video.loading',
                errorLabel: 'video.error',
            },
        },
        {
            id: 'venue',
            type: 'venue',
            enabled: true,
            content: {
                label: 'venue.label',
                mapLabel: 'venue.map',
                mapPickerLabel: 'venue.map.choose',
                mapPickerCloseLabel: 'venue.map.close',
                mapProviders: [
                    {id: 'device', label: 'venue.map.device', badge: 'venue.map.recommended'},
                    {id: 'google', label: 'venue.map.google'},
                    {id: 'apple', label: 'venue.map.apple'},
                ],
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
                closedLabel: 'rsvp.closed.cta',
            },
        },
    ],
    capabilities: {
        rsvp: {
            enabled: true,
            deadline: '2027-05-12T23:59:59+02:00',
            form: weddingRsvpForm,
        },
        admin: {
            enabled: true,
            source: 'rsvp',
            columns: ['fullName', 'attending', 'dietaryOptions', 'busOption', 'songRequest', 'message'],
            metrics: {attendanceFieldId: 'attending', transportFieldId: 'busOption', ownTransportValue: 'no'},
            controls: {
                csvExport: {enabled: true},
                search: {enabled: true},
                sorting: {enabled: true, default: 'newest'},
                pagination: {
                    enabled: true,
                    pageSize: 10,
                    pageSizeSelector: {enabled: true, options: [10, 25, 50, 100]},
                },
                resultCount: {enabled: true},
                freshness: {enabled: true},
            },
        },
    },
} as const satisfies InvitationDefinition<WeddingLocale, WeddingMessageKey>

const definitionErrors = validateInvitationDefinition(weddingInvitation)
if (definitionErrors.length > 0) {
    throw new Error(`Invalid wedding invitation: ${definitionErrors.join('; ')}`)
}

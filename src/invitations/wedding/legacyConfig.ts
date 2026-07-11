import type {InvitationSection, VenueItemDefinition} from '../../core/invitation'
import type {ThemeId} from '../../design/themes'
import {weddingInvitation} from './invitation'
import {esMessages} from './locales/es'
import type {WeddingMessageKey} from './locales/es'

type WeddingSection = InvitationSection<WeddingMessageKey>

function resolveMessage(key: WeddingMessageKey): string {
    return esMessages[key]
}

function findSection<Type extends WeddingSection['type']>(
    type: Type,
): Extract<WeddingSection, { type: Type }> {
    const section: WeddingSection | undefined = weddingInvitation.sections.find(item => item.type === type)
    if (!section || section.type !== type) throw new Error(`Missing wedding section: ${type}`)
    return section as Extract<WeddingSection, { type: Type }>
}

function findVenue(id: string): VenueItemDefinition<WeddingMessageKey> {
    const venue = findSection('venue').content.items.find(item => item.id === id)
    if (!venue) throw new Error(`Missing wedding venue: ${id}`)
    return venue
}

const hero = findSection('hero')
const countdown = findSection('countdown')
const venue = findSection('venue')
const rsvpCta = findSection('rsvp-cta')
const ceremony = findVenue('ceremony')
const reception = findVenue('reception')
const rsvp = weddingInvitation.capabilities.rsvp

export type WeddingConfig = {
    partners: { partner1: string; partner2: string }
    date: string
    venue: {
        ceremony: { name: string; time?: string; address?: string; mapsQuery?: string }
        reception: { name: string; time?: string; address?: string; mapsQuery?: string }
    }
    rsvpDeadline: string
    hashtag: string
    showVenue: boolean
    showCountdown: boolean
    slug: string
    theme: ThemeId
    invitation: { title: string; subtitle: string; rsvpButtonText: string }
    admin: { title: string }
}

export const weddingConfig: WeddingConfig = {
    partners: {
        partner1: resolveMessage(hero.content.partnerOne),
        partner2: resolveMessage(hero.content.partnerTwo),
    },
    date: weddingInvitation.event.date,
    venue: {
        ceremony: {
            name: resolveMessage(ceremony.name),
            time: ceremony.time,
            address: ceremony.address ? resolveMessage(ceremony.address) : undefined,
            mapsQuery: ceremony.mapsQuery,
        },
        reception: {
            name: resolveMessage(reception.name),
            time: reception.time,
            address: reception.address ? resolveMessage(reception.address) : undefined,
            mapsQuery: reception.mapsQuery,
        },
    },
    rsvpDeadline: rsvp.deadline,
    hashtag: weddingInvitation.event.hashtag,
    showVenue: venue.enabled,
    showCountdown: countdown.enabled,
    slug: weddingInvitation.id,
    theme: weddingInvitation.theme.id,
    invitation: {
        title: resolveMessage(weddingInvitation.event.title),
        subtitle: resolveMessage(hero.content.subtitle),
        rsvpButtonText: resolveMessage(rsvpCta.content.label),
    },
    admin: {
        title: resolveMessage('admin.title'),
    },
}


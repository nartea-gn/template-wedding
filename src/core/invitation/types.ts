import type {LocalizationDefinition} from '../localization'
import type {FormDefinition} from '../forms'

type Section<Type extends string, Content> = {
    id: string
    type: Type
    enabled: boolean
    content: Content
}

export type HeroSection<Message extends string> = Section<'hero', {
    partnerOne: Message
    partnerTwo: Message
    subtitle: Message
}>

export type CountdownSection<Message extends string> = Section<'countdown', {
    label: Message
    target: string
    unitLabels: { days: Message; hours: Message; minutes: Message; seconds: Message }
}>

export type VideoSection<Message extends string> = Section<'video', {
    assetId: string
    label: Message
    playLabel: Message
}>

export type VenueItemDefinition<Message extends string> = {
    id: string
    typeLabel: Message
    name: Message
    time?: string
    address?: Message
    mapsQuery?: string
}

export type VenueSection<Message extends string> = Section<'venue', {
    label: Message
    mapLabel: Message
    items: readonly VenueItemDefinition<Message>[]
}>

export type RsvpCtaSection<Message extends string> = Section<'rsvp-cta', {
    label: Message
}>

export type InvitationSection<Message extends string> =
    | HeroSection<Message>
    | CountdownSection<Message>
    | VideoSection<Message>
    | VenueSection<Message>
    | RsvpCtaSection<Message>

export type InvitationCapabilities<Message extends string> = {
    rsvp?: {
        enabled: boolean
        deadline: string
        form: FormDefinition<Message>
    }
    admin?: {
        enabled: boolean
        source: 'rsvp'
        columns: readonly string[]
        metrics: { attendanceFieldId: string; transportFieldId?: string; ownTransportValue?: string }
    }
}

export type InvitationDefinition<Locale extends string, Message extends string> = {
    id: string
    event: {
        type: string
        title: Message
        date: string
        timezone: string
        hashtag?: string
    }
    theme: {
        id: string
    }
    seo: {
        title: Message
        description: Message
    }
    localization: LocalizationDefinition<Locale>
    sections: readonly InvitationSection<Message>[]
    capabilities: InvitationCapabilities<Message>
}

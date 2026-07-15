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
    posterAssetId?: string
    preload?: 'none' | 'metadata' | 'auto'
    aspectRatio?: `${number} / ${number}`
    label: Message
    playLabel: Message
    loadingLabel: Message
    errorLabel: Message
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
    mapPickerLabel: Message
    mapPickerCloseLabel: Message
    mapProviders?: readonly {
        id: 'device' | 'google' | 'apple'
        label: Message
    }[]
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

export type AdminSortOrder = 'newest' | 'oldest' | 'identity-asc' | 'identity-desc'

export type AdminReadControls = {
    csvExport?: { enabled: boolean }
    search?: { enabled: boolean }
    sorting?: { enabled: boolean; default: AdminSortOrder }
    pagination?: {
        enabled: boolean
        pageSize: number
        pageSizeSelector?: { enabled: boolean; options: readonly number[] }
    }
    resultCount?: { enabled: boolean }
    freshness?: { enabled: boolean }
}

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
        controls?: AdminReadControls
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

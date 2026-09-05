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
    /** Shown on the wedding day itself, in place of the clock. */
    todayLabel: Message
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
        badge?: Message
    }[]
    items: readonly VenueItemDefinition<Message>[]
}>

export type RsvpCtaSection<Message extends string> = Section<'rsvp-cta', {
    label: Message
    closedLabel: Message
}>

export type LodgingPriceTier = 1 | 2 | 3

export type LodgingItemDefinition<Message extends string> = {
    id: string
    name: Message
    address?: Message
    bookingUrl: string
    priceTier?: LodgingPriceTier
    highlightKey?: Message
    noteKey?: Message
}

export type LodgingSection<Message extends string> = Section<'lodging', {
    label: Message
    noteKey?: Message
    bookingLabel: Message
    newTabLabel: Message
    priceTierLabels?: Readonly<Record<LodgingPriceTier, Message>>
    items: readonly LodgingItemDefinition<Message>[]
}>

export type GiftsSection<Message extends string> = Section<'gifts', {
    label: Message
    noteKey?: Message
    /** Line that cuts the most common fraud: the couple never asks to change the number. */
    fraudWarningKey: Message
    newTabLabel: Message
    registry?: {
        url: string
        labelKey: Message
    }
    account?: {
        iban: string
        holderKey: Message
        bizum?: string
        /**
         * Keeps the account details out of the initial HTML until a guest asks for them.
         * Automated scraping is the realistic vector, and a Bizum number is a personal phone.
         */
        revealOnRequest: boolean
        revealLabel: Message
        ibanLabel: Message
        bizumLabel: Message
        copyLabel: Message
        copiedLabel: Message
    }
}>

export type InvitationSection<Message extends string> =
    | HeroSection<Message>
    | CountdownSection<Message>
    | VideoSection<Message>
    | VenueSection<Message>
    | LodgingSection<Message>
    | GiftsSection<Message>
    | RsvpCtaSection<Message>

export type AdminSortOrder = 'newest' | 'oldest' | 'identity-asc' | 'identity-desc'

export type AdminAuthMethod = 'otp' | 'password'

export type AdminAuthDefinition =
    | { method: 'otp' }
    | { method: 'password' }

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

/**
 * Panel actions that write back to the database, as opposed to the read-only controls of
 * {@link AdminReadControls}.
 */
export type AdminMutationControls = {
    rsvpClosure?: { enabled: boolean }
}

export type InvitationCapabilities<Message extends string> = {
    rsvp?: {
        enabled: boolean
        deadline: string
        form: FormDefinition<Message>
    }
    admin?: {
        enabled: boolean
        auth: AdminAuthDefinition
        source: 'rsvp'
        columns: readonly string[]
        metrics: { attendanceFieldId: string; transportFieldId?: string; ownTransportValue?: string }
        controls?: AdminReadControls
        mutations?: AdminMutationControls
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
    /**
     * Data controller under GDPR article 13: the couple, never the agency.
     *
     * Mandatory on purpose. Article 13 requires the identity and contact details of the
     * controller, so an invitation that cannot name one must not build.
     */
    controller: {
        /** Message key naming the people responsible for the guests' data. */
        name: Message
        /** Address guests write to in order to exercise their rights. */
        email: string
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

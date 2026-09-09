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
    /**
     * Pinta la fecha del evento sobre el poster, leyendola de `event.date`.
     *
     * El poster que se envia hoy la lleva **quemada en el pixel**, y decia «26.06.2027» contra el
     * `2027-06-12` configurado: dos afirmaciones sobre el mismo dato, una de ellas en un bitmap
     * que ninguna validacion puede leer. Un dato en una imagen no se puede traducir, ni corregir
     * sin un editor grafico, ni comprobar contra el contrato.
     *
     * Activarlo **exige un poster sin texto**. Con el actual se verian dos fechas distintas a la
     * vez, que es peor que una sola equivocada. Cuando el asset se regenere, esto se enciende y
     * la fecha pasa a ser traducible, accesible e imposible de desincronizar.
     */
    dateOverlay?: boolean
}>

/**
 * One place a guest has to reach.
 *
 * `address` and `mapsQuery` are mutually exclusive, and the validator rejects an item carrying
 * both. Nothing tied them together before: the ceremony card read "Calle Mayor, 1, Madrid" while
 * "Cómo llegar" opened "C. del Nuncio, 14, Centro, 28005 Madrid", and a guest who read the card
 * and a guest who tapped the button went to two different places on a day that happens once.
 *
 * `mapsQuery` is the better of the two for a real venue, and not only because it is precise: it
 * is locale-independent. The Bulgarian catalogue transliterated the street as "Кале Майор 1,
 * Мадрид", which reads correctly and navigates nowhere, so deriving the query from the displayed
 * string would have replaced one broken direction with another. Street names are proper nouns;
 * showing the same untranslated string the map receives is both correct and honest.
 *
 * `address` remains for a venue with no navigable address -- "en casa de los abuelos" -- which is
 * exactly the case where no map button should appear either.
 */
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
    /**
     * Aviso con la fecha limite, junto a la llamada. Lleva `{date}`, que la seccion sustituye.
     *
     * Opcional para no romper una invitacion sin plazo, pero recomendado: la fecha gobernaba el
     * cierre sin aparecer en ninguna superficie ni idioma, y una urgencia sin fecha es la primera
     * causa de confirmaciones tardias.
     */
    deadlineNotice?: Message
    /**
     * Si esta instancia cierra la invitacion.
     *
     * La invitacion de esta plantilla declara una sola llamada, la del cierre, y es la que lleva
     * el hashtag. El campo existe porque el tipo se puede declarar mas de una vez -- con ids
     * distintos, que `validateInvitationDefinition` exige -- y entonces repetir el hashtag en
     * cada una seria ruido: solo la marcada aqui lo muestra.
     */
    closing?: boolean
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
        /**
         * Rotulo de cada columna en el panel, por id de campo.
         *
         * Sin esto la tabla usaba la etiqueta del formulario, o sea **las preguntas que se le
         * hicieron al invitado**: "¿Podrás asistir?", "Tu mensaje", "Otros detalles...". El panel
         * lo lee la pareja, no el invitado, y necesita sustantivos -- "Asiste", "Mensaje" -- que
         * quepan en una cabecera. Los que falten caen a la etiqueta del formulario.
         */
        columnLabels?: Readonly<Record<string, string>>
        metrics: {
            attendanceFieldId: string
            transportFieldId?: string
            ownTransportValue?: string
            /** Campos cuyo valor significa que ese invitado necesita algo del catering. */
            dietaryFieldIds?: readonly string[]
        }
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

import type {LocalizationDefinition, MessageCatalog} from './types'

export type CatalogLoader = () => Promise<MessageCatalog>

export type LocalizationRuntimeConfig<Locale extends string> = {
    invitationId: string
    definition: LocalizationDefinition<Locale>
    defaultCatalog: MessageCatalog
    loaders: Partial<Record<Locale, CatalogLoader>>
}

export function isSupportedLocale<Locale extends string>(locale: string, definition: LocalizationDefinition<Locale>): locale is Locale {
    return definition.supportedLocales.some(supported => supported === locale)
}

export function getLocaleStorageKey(invitationId: string): string {
    return `invitation:${invitationId}:locale`
}

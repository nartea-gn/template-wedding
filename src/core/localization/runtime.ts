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

/**
 * Orders the catalogs consulted for a locale, from the locale itself outwards.
 */
export function getFallbackChain<Locale extends string>(
    locale: Locale,
    definition: LocalizationDefinition<Locale>,
): readonly Locale[] {
    const chain: Locale[] = [locale]
    const visited = new Set<Locale>([locale])
    let next = definition.fallback?.[locale]

    // `visited` closes the chain on a misdeclared cycle. Two locales pointing at each other is a
    // configuration mistake, and hanging the render is a worse answer than falling back.
    while (next && !visited.has(next)) {
        chain.push(next)
        visited.add(next)
        next = definition.fallback?.[next]
    }

    if (!visited.has(definition.defaultLocale)) chain.push(definition.defaultLocale)

    return chain
}

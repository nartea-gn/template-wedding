export type MessageCatalog = Readonly<Record<string, string>>

export const DEFAULT_LOCALE = 'es' as const

export type MessageKey<Catalog extends MessageCatalog> = Extract<keyof Catalog, string>

export type LocalizationDefinition<Locale extends string> = {
    defaultLocale: Locale
    supportedLocales: readonly Locale[]
    selector: {
        visible: boolean
    }
    /**
     * Locale each locale falls back to when a key is missing, declared one step at a time.
     *
     * A locale absent from this map falls back to `defaultLocale`. Declaring the chain is what
     * keeps it visible: inheriting a catalog by spreading another one compiles clean, hides the
     * gap from TypeScript, and ships the wrong language instead of failing.
     */
    fallback?: Partial<Record<Locale, Locale>>
}

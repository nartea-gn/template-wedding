export type MessageCatalog = Readonly<Record<string, string>>

export const DEFAULT_LOCALE = 'es' as const

export type MessageKey<Catalog extends MessageCatalog> = Extract<keyof Catalog, string>

export type LocalizationDefinition<Locale extends string> = {
    defaultLocale: Locale
    supportedLocales: readonly Locale[]
    selector: {
        visible: boolean
    }
}

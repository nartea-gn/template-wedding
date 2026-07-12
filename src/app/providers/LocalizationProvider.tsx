import {type ReactNode, useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {
    getLocaleStorageKey,
    isSupportedLocale,
    type LocalizationRuntimeConfig,
    type MessageCatalog
} from '../../core/localization'
import {LocalizationContext, type LocalizationContextValue} from './LocalizationContext'

type Props<Locale extends string> = LocalizationRuntimeConfig<Locale> & { timeZone: string; children: ReactNode }

export function LocalizationProvider<Locale extends string>({
                                                                invitationId,
                                                                definition,
                                                                defaultCatalog,
                                                                loaders,
                                                                timeZone,
                                                                children
                                                            }: Readonly<Props<Locale>>) {
    const [locale, setActiveLocale] = useState<Locale>(definition.defaultLocale)
    const [catalog, setCatalog] = useState<MessageCatalog>(defaultCatalog)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const requestId = useRef(0)
    const storageKey = getLocaleStorageKey(invitationId)
    const hasMultipleLocales = definition.supportedLocales.length > 1

    const setLocale = useCallback(async (nextLocale: string) => {
        if (!isSupportedLocale(nextLocale, definition) || nextLocale === locale) return
        const currentRequest = ++requestId.current
        setIsLoading(true)
        setError(null)
        try {
            const nextCatalog = nextLocale === definition.defaultLocale ? defaultCatalog : await loaders[nextLocale]?.()
            if (!nextCatalog) throw new Error(`No catalog loader registered for ${nextLocale}`)
            if (currentRequest !== requestId.current) return
            setCatalog(nextCatalog)
            setActiveLocale(nextLocale)
            if (hasMultipleLocales) localStorage.setItem(storageKey, nextLocale)
        } catch {
            if (currentRequest === requestId.current) setError('language_load_failed')
        } finally {
            if (currentRequest === requestId.current) setIsLoading(false)
        }
    }, [defaultCatalog, definition, hasMultipleLocales, loaders, locale, storageKey])

    useEffect(() => {
        document.documentElement.lang = locale
    }, [locale])

    useEffect(() => {
        if (!hasMultipleLocales) {
            localStorage.removeItem(storageKey)
            return
        }
        const persistedLocale = localStorage.getItem(storageKey)
        // eslint-disable-next-line react-hooks/set-state-in-effect -- persisted secondary catalogs load after mount
        if (persistedLocale && persistedLocale !== definition.defaultLocale) void setLocale(persistedLocale)
    }, [definition.defaultLocale, hasMultipleLocales, setLocale, storageKey])

    const t = useCallback((key: string) => {
        const translated = catalog[key] ?? defaultCatalog[key]
        if (translated !== undefined) return translated
        if (import.meta.env.DEV) console.warn(`Missing translation: ${key}`)
        return ''
    }, [catalog, defaultCatalog])

    const formatDate = useCallback((value: string | Date, options?: Intl.DateTimeFormatOptions) => (
        new Intl.DateTimeFormat(locale, {timeZone, ...options}).format(new Date(value))
    ), [locale, timeZone])

    const contextValue = useMemo<LocalizationContextValue>(() => ({
        locale,
        supportedLocales: definition.supportedLocales,
        selectorVisible: definition.selector.visible && hasMultipleLocales,
        isLoading,
        error,
        t,
        setLocale,
        formatDate
    }), [definition.selector.visible, definition.supportedLocales, error, formatDate, hasMultipleLocales, isLoading, locale, setLocale, t])

    return <LocalizationContext.Provider value={contextValue}>{children}</LocalizationContext.Provider>
}

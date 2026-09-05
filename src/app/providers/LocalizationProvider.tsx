import {type ReactNode, useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {
    getFallbackChain,
    getLocaleStorageKey,
    isSupportedLocale,
    type LocalizationRuntimeConfig,
    type MessageCatalog
} from '../../core/localization'
import {LocalizationContext, type LocalizationContextValue} from './LocalizationContext'
import {devWarn} from '../../lib/devLog'

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
    const [catalogs, setCatalogs] = useState<readonly MessageCatalog[]>([defaultCatalog])
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const requestId = useRef(0)
    const storageKey = getLocaleStorageKey(invitationId)
    // Read through a ref rather than a dependency: depending on `locale` gives `setLocale` a new
    // identity on every switch, which re-fires the effect that restores the persisted locale.
    const localeRef = useRef(locale)
    const hasMultipleLocales = definition.supportedLocales.length > 1

    const setLocale = useCallback(async (nextLocale: string) => {
        if (!isSupportedLocale(nextLocale, definition) || nextLocale === localeRef.current) return
        const currentRequest = ++requestId.current
        setIsLoading(true)
        setError(null)
        try {
            // The whole chain is loaded, not just the target locale: a key the target does not
            // translate has to resolve against the locale that was declared next, and that
            // catalog is only in the bundle if something asks for it.
            const chain = getFallbackChain(nextLocale, definition)
            const nextCatalogs = await Promise.all(chain.map(step => (
                step === definition.defaultLocale ? defaultCatalog : loaders[step]?.()
            )))
            const missing = chain.find((_, index) => !nextCatalogs[index])
            if (missing) throw new Error(`No catalog loader registered for ${missing}`)
            if (currentRequest !== requestId.current) return
            setCatalogs(nextCatalogs as readonly MessageCatalog[])
            setActiveLocale(nextLocale)
            if (hasMultipleLocales) localStorage.setItem(storageKey, nextLocale)
        } catch {
            if (currentRequest === requestId.current) setError('language_load_failed')
        } finally {
            if (currentRequest === requestId.current) setIsLoading(false)
        }
    }, [defaultCatalog, definition, hasMultipleLocales, loaders, storageKey])

    useEffect(() => {
        localeRef.current = locale
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
        for (const candidate of catalogs) {
            const translated = candidate[key]
            if (translated !== undefined) return translated
        }
        devWarn(`Missing translation: ${key}`)
        return ''
    }, [catalogs])

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

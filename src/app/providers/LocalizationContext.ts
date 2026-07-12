import {createContext} from 'react'

export type LocalizationContextValue = {
    locale: string
    supportedLocales: readonly string[]
    selectorVisible: boolean
    isLoading: boolean
    error: string | null
    t: (key: string) => string
    setLocale: (locale: string) => Promise<void>
    formatDate: (value: string | Date, options?: Intl.DateTimeFormatOptions) => string
}

export const LocalizationContext = createContext<LocalizationContextValue | null>(null)

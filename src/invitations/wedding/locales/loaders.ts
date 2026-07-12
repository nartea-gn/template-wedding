import type {CatalogLoader} from '../../../core/localization'
import type {WeddingLocale} from './types'

export const weddingCatalogLoaders = {
    en: async () => (await import('./en')).enMessages,
    bg: async () => (await import('./bg')).bgMessages,
} satisfies Partial<Record<WeddingLocale, CatalogLoader>>

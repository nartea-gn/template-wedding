import type {CatalogLoader, MessageCatalog} from '../../../core/localization'
import {esMessages} from './es'
import type {WeddingLocale} from './types'
import {resolveCoupleVariables} from './variables'

/**
 * The default catalog, resolved once at module scope.
 *
 * `LocalizationProvider` keeps it in state and lists it in an effect's dependencies, so resolving
 * it per render would hand the effect a new identity every time and reload the catalogs forever.
 */
export const weddingDefaultCatalog: MessageCatalog = resolveCoupleVariables(esMessages, 'es')

export const weddingCatalogLoaders = {
    en: async () => resolveCoupleVariables((await import('./en')).enMessages, 'en'),
    bg: async () => resolveCoupleVariables((await import('./bg')).bgMessages, 'bg'),
} satisfies Partial<Record<WeddingLocale, CatalogLoader>>

import {describe, expect, it} from 'vitest'
import type {LocalizationDefinition} from './types'
import {getFallbackChain, getLocaleStorageKey, isSupportedLocale} from './runtime'

const definition: LocalizationDefinition<'es' | 'en'> = {
    defaultLocale: 'es',
    supportedLocales: ['es', 'en'],
    selector: {visible: true},
}

describe('localization runtime', () => {
    it('recognizes only configured locales', () => {
        expect(isSupportedLocale('en', definition)).toBe(true)
        expect(isSupportedLocale('fr', definition)).toBe(false)
    })

    it('isolates persisted locale by invitation', () => {
        expect(getLocaleStorageKey('gala-y-valentin')).toBe('invitation:gala-y-valentin:locale')
    })
})

describe('fallback chain', () => {
    it('walks every declared step before reaching the default locale', () => {
        const trilingual: LocalizationDefinition<'es' | 'en' | 'bg'> = {
            defaultLocale: 'es',
            supportedLocales: ['es', 'en', 'bg'],
            selector: {visible: true},
            fallback: {bg: 'en', en: 'es'},
        }

        expect(getFallbackChain('bg', trilingual)).toEqual(['bg', 'en', 'es'])
    })

    it('reaches the default locale from a locale that declares no fallback', () => {
        expect(getFallbackChain('en', definition)).toEqual(['en', 'es'])
    })

    it('does not repeat the default locale in its own chain', () => {
        expect(getFallbackChain('es', definition)).toEqual(['es'])
    })

    it('stops instead of looping when two locales fall back to each other', () => {
        const circular: LocalizationDefinition<'es' | 'en' | 'bg'> = {
            defaultLocale: 'es',
            supportedLocales: ['es', 'en', 'bg'],
            selector: {visible: true},
            fallback: {bg: 'en', en: 'bg'},
        }

        expect(getFallbackChain('bg', circular)).toEqual(['bg', 'en', 'es'])
    })
})

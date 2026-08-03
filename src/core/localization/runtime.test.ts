import {describe, expect, it} from 'vitest'
import type {LocalizationDefinition} from './types'
import {getLocaleStorageKey, isSupportedLocale} from './runtime'

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

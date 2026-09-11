// @vitest-environment node
import {afterEach, describe, expect, it, vi} from 'vitest'
import {resolveCoupleVariables} from './variables'

afterEach(() => {
    vi.unstubAllEnvs()
})

describe('resolveCoupleVariables', () => {
    it('writes the couple into the holes each language left', () => {
        // Given a catalog that declares grammar around the names
        const catalog = {'event.seoTitle': 'Invitación de boda de {partnerOne} y {partnerTwo}'}

        // When the catalog is resolved
        const resolved = resolveCoupleVariables(catalog, 'es')

        // Then the names arrive inside the sentence
        expect(resolved['event.seoTitle']).toBe('Invitación de boda de Gala y Valentin')
    })

    it('resolves surnames alongside first names', () => {
        // Given surnames in the environment and a message that needs both halves
        vi.stubEnv('VITE_SURNAME_ONE', 'García')
        vi.stubEnv('VITE_SURNAME_TWO', 'Petrov')
        const catalog = {'gifts.account.holder': '{partnerOne} {surnameOne} y {partnerTwo} {surnameTwo}'}

        // When the catalog is resolved
        const resolved = resolveCoupleVariables(catalog, 'es')

        // Then the holder reads in full
        expect(resolved['gifts.account.holder']).toBe('Gala García y Valentin Petrov')
    })

    it('takes the space with it when a surname is not declared', () => {
        // Given no surnames in the environment
        const catalog = {'gifts.account.holder': '{partnerOne} {surnameOne} y {partnerTwo} {surnameTwo}'}

        // When the catalog is resolved
        const resolved = resolveCoupleVariables(catalog, 'es')

        // Then the sentence closes up instead of keeping the gap the surname left
        expect(resolved['gifts.account.holder']).toBe('Gala y Valentin')
    })

    it('resolves one surname without waiting for the other', () => {
        // Given a surname for one half of the couple only
        vi.stubEnv('VITE_SURNAME_ONE', 'García')
        const catalog = {'gifts.account.holder': '{partnerOne} {surnameOne} y {partnerTwo} {surnameTwo}'}

        // When the catalog is resolved
        const resolved = resolveCoupleVariables(catalog, 'es')

        // Then only the declared half carries a surname
        expect(resolved['gifts.account.holder']).toBe('Gala García y Valentin')
    })

    it('keeps a placeholder that opens the message', () => {
        // Given a message that starts with a name, so there is no space to swallow
        const catalog = {'hero.partnerOne': '{partnerOne} y {partnerTwo}'}

        // When the catalog is resolved
        const resolved = resolveCoupleVariables(catalog, 'es')

        // Then it does not lose its first character
        expect(resolved['hero.partnerOne']).toBe('Gala y Valentin')
    })

    it('resolves each locale with its own spelling', () => {
        // Given the same message key in the locale that transliterates
        const catalog = {'hero.partnerOne': '{partnerOne}'}

        // When the catalog is resolved for that locale
        const resolved = resolveCoupleVariables(catalog, 'bg')

        // Then the transliterated spelling answers
        expect(resolved['hero.partnerOne']).toBe('Гала')
    })

    it('reads the names from the environment', () => {
        // Given a couple declared in the environment
        vi.stubEnv('VITE_PARTNER_ONE', 'Ana')
        vi.stubEnv('VITE_PARTNER_TWO', 'Bruno')
        const catalog = {'controller.name': '{partnerOne} y {partnerTwo}'}

        // When the catalog is resolved
        const resolved = resolveCoupleVariables(catalog, 'es')

        // Then the environment reaches the rendered copy
        expect(resolved['controller.name']).toBe('Ana y Bruno')
    })

    it('leaves a message with no placeholder untouched', () => {
        // Given a message that names nobody
        const catalog = {'common.yes': 'Sí'}

        // When the catalog is resolved
        const resolved = resolveCoupleVariables(catalog, 'es')

        // Then it comes back as it was
        expect(resolved['common.yes']).toBe('Sí')
    })

    it('leaves an unknown placeholder verbatim so the typo is visible', () => {
        // Given a placeholder no variable answers to
        const catalog = {'hero.subtitle': 'Boda de {partnerUno}'}

        // When the catalog is resolved
        const resolved = resolveCoupleVariables(catalog, 'es')

        // Then the hole stays on screen instead of resolving to nothing
        expect(resolved['hero.subtitle']).toBe('Boda de {partnerUno}')
    })

    it('keeps every key the catalog declared', () => {
        // Given a catalog with resolved and untouched messages
        const catalog = {'hero.partnerOne': '{partnerOne}', 'common.no': 'No'}

        // When the catalog is resolved
        const resolved = resolveCoupleVariables(catalog, 'es')

        // Then the key set is unchanged, which is what the fallback chain walks
        expect(Object.keys(resolved)).toEqual(['hero.partnerOne', 'common.no'])
    })
})

describe('resolveCoupleVariables base placeholders', () => {
    it('keeps the hashtag out of the per-locale spelling', () => {
        // Given a couple whose names the Bulgarian catalog transliterates
        vi.stubEnv('VITE_PARTNER_ONE', 'Ana')
        vi.stubEnv('VITE_PARTNER_TWO', 'Bruno')
        vi.stubEnv('VITE_PARTNER_ONE_BG', 'Ана')
        vi.stubEnv('VITE_PARTNER_TWO_BG', 'Бруно')
        const catalog = {
            'event.hashtag': '#Wedding{partnerOneBase}Y{partnerTwoBase}',
            'hero.partnerOne': '{partnerOne}',
        }

        // When that catalog is resolved
        const resolved = resolveCoupleVariables(catalog, 'bg')

        // Then the prose transliterates and the tag does not
        expect(resolved['hero.partnerOne']).toBe('Ана')
        expect(resolved['event.hashtag']).toBe('#WeddingAnaYBruno')
    })
})

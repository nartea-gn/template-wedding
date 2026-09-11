// @vitest-environment node
import {afterEach, describe, expect, it, vi} from 'vitest'
import {coupleNames} from './couple'

afterEach(() => {
    vi.unstubAllEnvs()
})

describe('coupleNames', () => {
    it('falls back to the names the template ships when the environment is silent', () => {
        // Given no couple in the environment
        // When the names are read for the default locale
        const names = coupleNames('es')

        // Then the template's own first names answer, with no surname to publish
        expect(names).toEqual({
            partnerOne: 'Gala',
            partnerTwo: 'Valentin',
            surnameOne: '',
            surnameTwo: '',
            partnerOneBase: 'Gala',
            partnerTwoBase: 'Valentin',
        })
    })

    it('falls back to the spelling each locale ships', () => {
        // Given no couple in the environment
        // When the names are read for the locale that transliterates them
        const names = coupleNames('bg')

        // Then its own spelling answers
        expect(names).toEqual({
            partnerOne: 'Гала',
            partnerTwo: 'Валентин',
            surnameOne: '',
            surnameTwo: '',
            partnerOneBase: 'Gala',
            partnerTwoBase: 'Valentin',
        })
    })

    it('reads the couple from the environment', () => {
        // Given a couple declared in the environment
        vi.stubEnv('VITE_PARTNER_ONE', 'Ana')
        vi.stubEnv('VITE_SURNAME_ONE', 'Ruiz')

        // When the names are read
        const names = coupleNames('es')

        // Then the environment wins over the template
        expect(names).toMatchObject({partnerOne: 'Ana', surnameOne: 'Ruiz'})
    })

    it('lets a locale override the spelling it transliterates', () => {
        // Given a base spelling and an override for one locale
        vi.stubEnv('VITE_PARTNER_ONE', 'Ana')
        vi.stubEnv('VITE_PARTNER_ONE_BG', 'Ана')

        // When each locale reads the name
        // Then each gets its own spelling
        expect(coupleNames('es').partnerOne).toBe('Ana')
        expect(coupleNames('bg').partnerOne).toBe('Ана')
    })

    it('takes the base spelling for a name the locale does not override', () => {
        // Given a base spelling and no override for it
        vi.stubEnv('VITE_PARTNER_TWO', 'Bruno')

        // When the transliterating locale reads the name
        // Then it takes the base spelling rather than the template's
        expect(coupleNames('bg').partnerTwo).toBe('Bruno')
    })

    it('leaves a surname empty when nobody declared one', () => {
        // Given only first names in the environment
        vi.stubEnv('VITE_PARTNER_ONE', 'Ana')

        // When the names are read
        const names = coupleNames('es')

        // Then the surname stays empty instead of inheriting the template's
        expect(names.surnameOne).toBe('')
        expect(names.surnameTwo).toBe('')
    })

    it('reads a surname the environment does declare', () => {
        // Given a surname in the environment
        vi.stubEnv('VITE_SURNAME_TWO', 'Petrov')

        // When the names are read
        // Then it answers
        expect(coupleNames('es').surnameTwo).toBe('Petrov')
    })

    it('treats a blank variable as unset, the way an undeclared Actions variable arrives', () => {
        // Given a variable declared empty
        vi.stubEnv('VITE_PARTNER_ONE', '   ')

        // When the names are read
        // Then the template answers instead of a blank name
        expect(coupleNames('es').partnerOne).toBe('Gala')
    })
})

describe('coupleNames base spellings', () => {
    it('answers with the shared spelling even for a locale that transliterates', () => {
        // Given an override for the locale that writes the names in another script
        vi.stubEnv('VITE_PARTNER_ONE', 'Ana')
        vi.stubEnv('VITE_PARTNER_ONE_BG', 'Ана')

        // When that locale reads both forms
        const names = coupleNames('bg')

        // Then prose gets the transliteration and the base form stays typable anywhere
        expect(names.partnerOne).toBe('Ана')
        expect(names.partnerOneBase).toBe('Ana')
    })

    it('falls back to the default catalog spelling, not the locale one', () => {
        // Given nothing in the environment
        // When the transliterating locale reads the base form
        // Then it gets the spelling the default catalog ships
        expect(coupleNames('bg').partnerTwoBase).toBe('Valentin')
    })
})

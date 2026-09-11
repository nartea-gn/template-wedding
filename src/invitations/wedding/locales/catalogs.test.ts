// @vitest-environment node
import {describe, expect, it} from 'vitest'
import {esMessages} from './es'
import {enMessages} from './en'
import {bgMessages} from './bg'
import {resolveCoupleVariables} from './variables'

// Nothing else in the stack can see a missing translation. `t()` walks the declared fallback
// chain before giving up, so a key defined only in `es.ts` renders Spanish inside an English
// panel instead of failing, and the DEV-only warning never fires because that fallback resolved.
// Eight `admin.actions.*` keys shipped that way. Parity is asserted here or nowhere.
//
// The chain is a runtime safety net, not a licence for an incomplete catalog: it guarantees the
// reader never meets an empty string, and this file guarantees they never meet the wrong
// language.
const catalogs = {en: enMessages, bg: bgMessages}

/**
 * Every spelling the couple has in this template, in both scripts. A catalog that contains one has
 * gone back to hardcoding a name the environment is meant to provide, which is exactly the state
 * `resolveCoupleVariables` exists to prevent -- and the kind of thing that only shows up on the
 * day someone deploys the template for a different couple and finds a stranger's name on screen.
 */
const COUPLE_SPELLINGS = [
    'Gala', 'Valentin', 'Valentín', 'García', 'Petrov',
    'Гала', 'Валентин', 'Гарсия', 'Петров',
]

describe.each(Object.entries({es: esMessages, ...catalogs}))('%s catalog', (_, catalog) => {
    it('names the couple through placeholders and never in the message itself', () => {
        const offenders = Object.entries(catalog)
            .filter(([, message]) => COUPLE_SPELLINGS.some(spelling => message.includes(spelling)))
            .map(([key]) => key)

        expect(offenders).toEqual([])
    })
})

describe.each(Object.entries(catalogs))('%s catalog', (_, catalog) => {
    it('covers every key the default catalog defines', () => {
        const missing = Object.keys(esMessages).filter(key => !(key in catalog))
        expect(missing).toEqual([])
    })

    it('defines no key the default catalog lacks', () => {
        const extra = Object.keys(catalog).filter(key => !(key in esMessages))
        expect(extra).toEqual([])
    })
})

/**
 * The tag is deliberately not once per language. Translating the word splits the photo wall, so
 * only Spanish keeps its own; English and Bulgarian share one, and no catalog writes the names in
 * a script a guest cannot type.
 */
describe('event.hashtag', () => {
    it.each([
        ['es', esMessages, '#BodaGalaYValentin'],
        ['en', enMessages, '#WeddingGalaYValentin'],
        ['bg', bgMessages, '#WeddingGalaYValentin'],
    ])('resolves to the declared tag in %s', (locale, catalog, expected) => {
        const resolved = resolveCoupleVariables(catalog, locale as 'es' | 'en' | 'bg')

        expect(resolved['event.hashtag']).toBe(expected)
    })

    it('writes every tag in the alphabet every keyboard can type', () => {
        const tags = [esMessages, enMessages, bgMessages].map(
            catalog => catalog['event.hashtag'],
        )

        expect(tags.every(tag => /^#[A-Za-z{}]+$/.test(tag))).toBe(true)
    })
})

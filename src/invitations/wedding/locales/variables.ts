import type {MessageCatalog} from '../../../core/localization'
import {coupleNames, type CoupleVariable} from '../couple'
import type {WeddingLocale} from './types'

/**
 * A placeholder, plus the single space that may sit in front of it.
 *
 * Swallowing that space is what makes an optional name optional: `{partnerOne} {surnameOne}` has to
 * read "Gala" and not "Gala " when no surname is declared, and no amount of trimming afterwards
 * could tell that space apart from one the language wanted.
 */
const PLACEHOLDER_PATTERN =
    / ?\{(partnerOneBase|partnerTwoBase|partnerOne|partnerTwo|surnameOne|surnameTwo)\}/g

/**
 * Writes the couple's names into a catalog once, as it loads.
 *
 * The alternative was interpolating inside `t()`, which would pay the substitution on every render
 * and push a wedding-specific vocabulary into the generic localization runtime. Doing it here also
 * keeps the catalogs free of the names themselves: each language declares its own grammar around
 * the holes -- `{partnerOne} and {partnerTwo}'s wedding` -- and the names arrive from one place.
 *
 * A placeholder this function does not know is left verbatim: a typo has to be visible on screen
 * rather than silently resolve to an empty string.
 */
export function resolveCoupleVariables(catalog: MessageCatalog, locale: WeddingLocale): MessageCatalog {
    const names = coupleNames(locale)
    return Object.fromEntries(Object.entries(catalog).map(([key, message]) => [
        key,
        message.replace(PLACEHOLDER_PATTERN, (match, variable) => {
            const name = names[variable as CoupleVariable]
            if (name.length === 0) return ''
            return match.startsWith(' ') ? ` ${name}` : name
        }),
    ]))
}

import type {WeddingLocale} from './locales/types'

export type CoupleVariable =
    | 'partnerOne'
    | 'partnerTwo'
    | 'surnameOne'
    | 'surnameTwo'
    | 'partnerOneBase'
    | 'partnerTwoBase'

export type CoupleNames = Readonly<Record<CoupleVariable, string>>

/**
 * The first names this template ships with, used whenever the environment says nothing.
 *
 * Falling back instead of throwing is deliberate, and the opposite of `supabaseConfig`: without an
 * API origin there is nothing to render, while without a name there is a demo to render. It also
 * keeps CI, the end-to-end suite and a bare `pnpm dev` green without a populated `.env`.
 *
 * Surnames are absent on purpose -- see {@link coupleNames}.
 */
const TEMPLATE_FIRST_NAMES: Readonly<Record<WeddingLocale, Pick<CoupleNames, 'partnerOne' | 'partnerTwo'>>> = {
    es: {partnerOne: 'Gala', partnerTwo: 'Valentin'},
    en: {partnerOne: 'Gala', partnerTwo: 'Valentin'},
    bg: {partnerOne: 'Гала', partnerTwo: 'Валентин'},
}

/**
 * Blank counts as absent.
 *
 * A GitHub Actions variable that was never declared arrives as an empty string, not as undefined,
 * so `??` alone would hand the page a nameless couple.
 */
function firstDeclared(candidates: readonly (string | undefined)[], fallback: string): string {
    return candidates.find(candidate => candidate !== undefined && candidate.trim().length > 0) ?? fallback
}

/**
 * The spelling a locale writes the couple in, when it is not the base one.
 *
 * Only Bulgarian transliterates today. A locale that writes the names in another script cannot be
 * derived from the Latin spelling, so adding one means declaring its variables here on purpose.
 * The reads stay inside the function because Vite replaces each `import.meta.env.VITE_*` access
 * statically wherever it appears, and reading at module scope would freeze the values before a
 * test could stub them.
 */
function localeOverrides(locale: WeddingLocale): Partial<CoupleNames> {
    if (locale !== 'bg') return {}
    return {
        partnerOne: import.meta.env.VITE_PARTNER_ONE_BG,
        partnerTwo: import.meta.env.VITE_PARTNER_TWO_BG,
        surnameOne: import.meta.env.VITE_SURNAME_ONE_BG,
        surnameTwo: import.meta.env.VITE_SURNAME_TWO_BG,
    }
}

/**
 * The couple's names for a locale: its own spelling, then the base one, then the template's.
 *
 * A surname has no template to fall back to and resolves empty, which erases its placeholder and
 * the space in front of it: an invitation that declares no surnames reads "Gala y Valentin", not
 * "Gala  y Valentin ". Surnames are the half of a name a couple may not want published, so the
 * default is to publish none.
 *
 * `partnerOneBase` and `partnerTwoBase` skip the per-locale override and answer with the spelling
 * every language shares. The hashtag is written with them: a tag has to be typable from any
 * keyboard and searchable as one string, so it must not fork once per script the way prose does.
 */
export function coupleNames(locale: WeddingLocale): CoupleNames {
    const overrides = localeOverrides(locale)
    const template = TEMPLATE_FIRST_NAMES[locale]
    // The base spelling is the one the default catalog ships, not the one this locale writes.
    const baseTemplate = TEMPLATE_FIRST_NAMES.es
    return {
        partnerOne: firstDeclared([overrides.partnerOne, import.meta.env.VITE_PARTNER_ONE], template.partnerOne),
        partnerTwo: firstDeclared([overrides.partnerTwo, import.meta.env.VITE_PARTNER_TWO], template.partnerTwo),
        surnameOne: firstDeclared([overrides.surnameOne, import.meta.env.VITE_SURNAME_ONE], ''),
        surnameTwo: firstDeclared([overrides.surnameTwo, import.meta.env.VITE_SURNAME_TWO], ''),
        partnerOneBase: firstDeclared([import.meta.env.VITE_PARTNER_ONE], baseTemplate.partnerOne),
        partnerTwoBase: firstDeclared([import.meta.env.VITE_PARTNER_TWO], baseTemplate.partnerTwo),
    }
}

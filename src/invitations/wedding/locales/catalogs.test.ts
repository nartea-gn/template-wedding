import {describe, expect, it} from 'vitest'
import {esMessages} from './es'
import {enMessages} from './en'
import {bgMessages} from './bg'

// Nothing else in the stack can see a missing translation. `t()` walks the declared fallback
// chain before giving up, so a key defined only in `es.ts` renders Spanish inside an English
// panel instead of failing, and the DEV-only warning never fires because that fallback resolved.
// Eight `admin.actions.*` keys shipped that way. Parity is asserted here or nowhere.
//
// The chain is a runtime safety net, not a licence for an incomplete catalog: it guarantees the
// reader never meets an empty string, and this file guarantees they never meet the wrong
// language.
const catalogs = {en: enMessages, bg: bgMessages}

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

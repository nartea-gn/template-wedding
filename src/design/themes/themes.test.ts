import {describe, expect, it} from 'vitest'
import {themes} from './themes'
import {readFileSync} from 'node:fs'
import {resolve} from 'node:path'

// Read as a file rather than imported: Vitest stubs CSS modules, so `?raw` comes back empty.
const patternsCss = readFileSync(resolve(process.cwd(), 'src/themes/patterns.css'), 'utf8')

describe('theme background art', () => {
    // `patterns.css` keys its background art off loose `[data-theme="..."]` strings that the
    // ThemeId union never sees. Renaming or adding a theme there compiles clean and silently
    // loses its background, so the coupling is asserted here instead.
    it.each(Object.keys(themes))('declares a block for the %s theme', id => {
        expect(patternsCss).toContain(`[data-theme="${id}"]`)
    })
})

describe.each(Object.entries(themes))('theme %s', (_, theme) => {
    it('keeps essential text roles at WCAG AA contrast', () => {
        expect(contrast(theme.colors.text, theme.colors.background)).toBeGreaterThanOrEqual(4.5)
        expect(contrast(theme.colors.text, theme.colors.surface)).toBeGreaterThanOrEqual(4.5)
        expect(contrast(theme.colors.muted, theme.colors.background)).toBeGreaterThanOrEqual(4.5)
        expect(contrast(theme.colors.muted, theme.colors.surface)).toBeGreaterThanOrEqual(4.5)
        expect(contrast(theme.colors.action, theme.colors.background)).toBeGreaterThanOrEqual(4.5)
        expect(contrast(theme.colors.action, theme.colors.surface)).toBeGreaterThanOrEqual(4.5)
        expect(contrast(theme.colors.onAction, theme.colors.action)).toBeGreaterThanOrEqual(4.5)
        expect(contrast(theme.colors.success, theme.colors.successSurface)).toBeGreaterThanOrEqual(4.5)
        expect(contrast(theme.colors.danger, theme.colors.dangerSurface)).toBeGreaterThanOrEqual(4.5)
    })

    it('keeps control boundaries at non-text contrast', () => {
        expect(contrast(theme.colors.controlBorder, theme.colors.background)).toBeGreaterThanOrEqual(3)
    })
})

function contrast(first: string, second: string) {
    const lighter = Math.max(luminance(first), luminance(second))
    const darker = Math.min(luminance(first), luminance(second))
    return (lighter + 0.05) / (darker + 0.05)
}

function luminance(hex: string) {
    const channels = hex.match(/[\dA-F]{2}/gi)
    if (!channels || channels.length !== 3) throw new Error(`Invalid color: ${hex}`)

    const [red, green, blue] = channels.map(channel => {
        const value = Number.parseInt(channel, 16) / 255
        return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
    })
    return 0.2126 * red + 0.7152 * green + 0.0722 * blue
}

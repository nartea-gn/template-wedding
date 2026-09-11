export type ThemeDefinition = {
    colors: {
        background: string
        primary: string
        action: string
        onAction: string
        text: string
        surface: string
        border: string
        muted: string
        controlBorder: string
        success: string
        successSurface: string
        danger: string
        dangerSurface: string
    }
    typography: {
        heading: string
        body: string
    }
    /**
     * Webfont families this theme needs, in the `Family+Name:wght@300;400` form Google Fonts uses.
     *
     * Declared rather than derived: the weights never appear in the CSS stack, and a stack can
     * quote a system face ("Times New Roman") that is not a webfont. Empty when the theme only
     * uses system fonts.
     *
     * Read by `scripts/vendor-fonts.mjs`, not at runtime: the faces are served from this origin
     * (`src/assets/fonts/`), so the page asks Google for nothing. The name of the field keeps the
     * source it came from, which is also where the script goes to refresh it; `fonts.test.ts`
     * asserts every family listed here has its faces on disk, because a theme whose family is
     * missing now falls back to a system face with no CDN left to rescue it.
     */
    googleFonts: readonly string[]
    shadows: {
        card: string
        cardLarge: string
        cardSmall: string
    }
    radius: {
        card: string
        small: string
        large: string
        extraLarge: string
    }
    composition: {
        sectionGap: string
        sectionGapWide: string
        ornamentGap: string
        ornamentGapWide: string
        editorialMaxWidth: string
        mediaMaxWidth: string
    }
    motion: {
        revealDuration: string
        revealDistance: string
        interactionDuration: string
    }
    surfaces: {
        contentCardOpacity: string
        formCardOpacity: string
    }
    decoration: {
        ornamentColor: string
        ornamentOpacity: string
    }
    iconography: {
        interfaceStrokeWidth: string
    }
}

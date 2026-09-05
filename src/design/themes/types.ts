export type ThemeDefinition = {
    colors: {
        background: string
        backgroundRgb: string
        primary: string
        primaryRgb: string
        action: string
        onAction: string
        text: string
        textRgb: string
        surface: string
        surfaceRgb: string
        border: string
        borderRgb: string
        muted: string
        mutedRgb: string
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
     * Google Fonts families this theme actually needs, in the `Family+Name:wght@300;400` form.
     *
     * Declared rather than derived: the weights never appear in the CSS stack, and a stack can
     * quote a system face ("Times New Roman") that is not a webfont. Empty when the theme only
     * uses system fonts. The build reads this to request one theme's families instead of all.
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

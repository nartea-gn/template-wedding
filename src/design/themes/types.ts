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

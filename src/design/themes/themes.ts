import type {ThemeDefinition} from './types'

export const themes = {
    royal: {
        colors: {
            background: '#F8F9FB',
            backgroundRgb: '248 249 251',
            primary: '#1B3A6B',
            primaryRgb: '27 58 107',
            text: '#0F2347',
            textRgb: '15 35 71',
            surface: '#EEF1F7',
            surfaceRgb: '238 241 247',
            border: '#C9A84C',
            borderRgb: '201 168 76',
            muted: '#6B7280',
            mutedRgb: '107 114 128'
        },
        typography: {
            heading: 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif',
            body: '"Josefin Sans", sans-serif'
        },
        shadows: {
            card: '0 4px 20px rgba(27, 58, 107, 0.08)',
            cardLarge: '0 12px 40px rgba(27, 58, 107, 0.12)',
            cardSmall: '0 2px 8px rgba(27, 58, 107, 0.05)'
        },
        radius: {card: '12px', small: '8px', large: '16px', extraLarge: '24px'},
        composition: {
            sectionGap: '4rem',
            sectionGapWide: '5rem',
            ornamentGap: '3.5rem',
            ornamentGapWide: '5rem',
            editorialMaxWidth: '56rem',
            mediaMaxWidth: '22.5rem',
        },
        motion: {revealDuration: '0.8s', revealDistance: '18px', interactionDuration: '0.25s'},
        surfaces: {contentCardOpacity: '70%', formCardOpacity: '80%'},
        decoration: {ornamentColor: '#C9A84C', ornamentOpacity: '0.9'},
        iconography: {interfaceStrokeWidth: '1.75'},
    },
    boho: {
        colors: {
            background: '#F5EFE6',
            backgroundRgb: '245 239 230',
            primary: '#7C9A6E',
            primaryRgb: '124 154 110',
            text: '#4A3728',
            textRgb: '74 55 40',
            surface: '#EDE4D8',
            surfaceRgb: '237 228 216',
            border: '#D4C5B0',
            borderRgb: '212 197 176',
            muted: '#8B7355',
            mutedRgb: '139 115 85'
        },
        typography: {heading: '"Cormorant Garamond", serif', body: '"Nunito", sans-serif'},
        shadows: {
            card: '0 4px 20px rgba(124, 154, 110, 0.1)',
            cardLarge: '0 12px 40px rgba(124, 154, 110, 0.15)',
            cardSmall: '0 2px 8px rgba(124, 154, 110, 0.06)'
        },
        radius: {card: '16px', small: '10px', large: '20px', extraLarge: '28px'},
        composition: {
            sectionGap: '4.5rem',
            sectionGapWide: '5.5rem',
            ornamentGap: '4rem',
            ornamentGapWide: '5.5rem',
            editorialMaxWidth: '54rem',
            mediaMaxWidth: '23rem',
        },
        motion: {revealDuration: '0.9s', revealDistance: '14px', interactionDuration: '0.3s'},
        surfaces: {contentCardOpacity: '78%', formCardOpacity: '84%'},
        decoration: {ornamentColor: '#B08A57', ornamentOpacity: '0.78'},
        iconography: {interfaceStrokeWidth: '1.6'},
    },
    dark: {
        colors: {
            background: '#0D0D0D',
            backgroundRgb: '13 13 13',
            primary: '#C9A84C',
            primaryRgb: '201 168 76',
            text: '#F0EAD6',
            textRgb: '240 234 214',
            surface: '#1A1A1A',
            surfaceRgb: '26 26 26',
            border: '#2E2E2E',
            borderRgb: '46 46 46',
            muted: '#9CA3AF',
            mutedRgb: '156 163 175'
        },
        typography: {heading: '"Cormorant Garamond", serif', body: '"Lato", sans-serif'},
        shadows: {
            card: '0 4px 20px rgba(0, 0, 0, 0.4)',
            cardLarge: '0 12px 40px rgba(0, 0, 0, 0.5)',
            cardSmall: '0 2px 8px rgba(0, 0, 0, 0.3)'
        },
        radius: {card: '12px', small: '8px', large: '16px', extraLarge: '24px'},
        composition: {
            sectionGap: '4rem',
            sectionGapWide: '4.5rem',
            ornamentGap: '3.5rem',
            ornamentGapWide: '4.5rem',
            editorialMaxWidth: '56rem',
            mediaMaxWidth: '22.5rem',
        },
        motion: {revealDuration: '0.65s', revealDistance: '12px', interactionDuration: '0.2s'},
        surfaces: {contentCardOpacity: '82%', formCardOpacity: '88%'},
        decoration: {ornamentColor: '#D7BD78', ornamentOpacity: '0.82'},
        iconography: {interfaceStrokeWidth: '1.6'},
    },
    magnolia: {
        colors: {
            background: '#FBF6F0',
            backgroundRgb: '251 246 240',
            primary: '#B76E79',
            primaryRgb: '183 110 121',
            text: '#3D1F28',
            textRgb: '61 31 40',
            surface: '#F2E8E4',
            surfaceRgb: '242 232 228',
            border: '#C9A27A',
            borderRgb: '201 162 122',
            muted: '#8B6F7D',
            mutedRgb: '139 111 125'
        },
        typography: {heading: '"Cormorant Garamond", serif', body: '"Raleway", sans-serif'},
        shadows: {
            card: '0 4px 20px rgba(183, 110, 121, 0.1)',
            cardLarge: '0 12px 40px rgba(183, 110, 121, 0.15)',
            cardSmall: '0 2px 8px rgba(183, 110, 121, 0.06)'
        },
        radius: {card: '14px', small: '9px', large: '18px', extraLarge: '26px'},
        composition: {
            sectionGap: '4.5rem',
            sectionGapWide: '5.5rem',
            ornamentGap: '4rem',
            ornamentGapWide: '5.5rem',
            editorialMaxWidth: '54rem',
            mediaMaxWidth: '22rem',
        },
        motion: {revealDuration: '0.9s', revealDistance: '16px', interactionDuration: '0.3s'},
        surfaces: {contentCardOpacity: '75%', formCardOpacity: '84%'},
        decoration: {ornamentColor: '#C9A27A', ornamentOpacity: '0.8'},
        iconography: {interfaceStrokeWidth: '1.6'},
    },
    linen: {
        colors: {
            background: '#FBF9F6',
            backgroundRgb: '251 249 246',
            primary: '#4A5343',
            primaryRgb: '74 83 67',
            text: '#2C3029',
            textRgb: '44 48 41',
            surface: '#F5F3EF',
            surfaceRgb: '245 243 239',
            border: '#D4C5B0',
            borderRgb: '212 197 176',
            muted: '#6B7264',
            mutedRgb: '107 114 100'
        },
        typography: {heading: '"Playfair Display", serif', body: '"Montserrat", sans-serif'},
        shadows: {
            card: '0 4px 20px rgba(74, 83, 67, 0.08)',
            cardLarge: '0 12px 40px rgba(74, 83, 67, 0.12)',
            cardSmall: '0 2px 8px rgba(74, 83, 67, 0.05)'
        },
        radius: {card: '12px', small: '8px', large: '16px', extraLarge: '24px'},
        composition: {
            sectionGap: '4.25rem',
            sectionGapWide: '5.25rem',
            ornamentGap: '3.75rem',
            ornamentGapWide: '5.25rem',
            editorialMaxWidth: '52rem',
            mediaMaxWidth: '22.5rem',
        },
        motion: {revealDuration: '0.75s', revealDistance: '12px', interactionDuration: '0.22s'},
        surfaces: {contentCardOpacity: '72%', formCardOpacity: '82%'},
        decoration: {ornamentColor: '#B59A6A', ornamentOpacity: '0.72'},
        iconography: {interfaceStrokeWidth: '1.5'},
    },
} as const satisfies Record<string, ThemeDefinition>

export type ThemeId = keyof typeof themes

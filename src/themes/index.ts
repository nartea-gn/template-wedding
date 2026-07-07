export type Theme = 'royal' | 'boho' | 'dark' | 'magnolia' | 'linen'

export type ThemeTokens = {
    '--color-bg': string
    '--color-primary': string
    '--color-text': string
    '--color-surface': string
    '--color-border': string
    '--font-heading': string
    '--font-body': string
}

export const themes: Record<Theme, ThemeTokens> = {
    royal: {
        '--color-bg': '#F8F9FB',
        '--color-primary': '#1B3A6B',
        '--color-text': '#0F2347',
        '--color-surface': '#EEF1F7',
        '--color-border': '#C9A84C',
        '--font-heading': '"Playfair Display", serif',
        '--font-body': '"Josefin Sans", sans-serif',
    },
    boho: {
        '--color-bg': '#F5EFE6',
        '--color-primary': '#7C9A6E',
        '--color-text': '#4A3728',
        '--color-surface': '#EDE4D8',
        '--color-border': '#D4C5B0',
        '--font-heading': '"Cormorant Garamond", serif',
        '--font-body': '"Nunito", sans-serif',
    },
    dark: {
        '--color-bg': '#0D0D0D',
        '--color-primary': '#C9A84C',
        '--color-text': '#F0EAD6',
        '--color-surface': '#1A1A1A',
        '--color-border': '#2E2E2E',
        '--font-heading': '"Cormorant Garamond", serif',
        '--font-body': '"Lato", sans-serif',
    },
    magnolia: {
        '--color-bg': '#FBF6F0',
        '--color-primary': '#B76E79',
        '--color-text': '#3D1F28',
        '--color-surface': '#F2E8E4',
        '--color-border': '#C9A27A',
        '--font-heading': '"Cormorant Garamond", serif',
        '--font-body': '"Raleway", sans-serif',
    },
    linen: {
        '--color-bg': '#FBF9F6',
        '--color-primary': '#4A5343',
        '--color-text': '#2C3029',
        '--color-surface': '#F5F3EF',
        '--color-border': '#D4C5B0',
        '--font-heading': '"Playfair Display", serif',
        '--font-body': '"Montserrat", sans-serif',
    },
}

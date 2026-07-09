export type Theme = 'royal' | 'boho' | 'dark' | 'magnolia' | 'linen'

export type ThemeTokens = {
    '--color-bg': string
    '--color-bg-rgb': string
    '--color-primary': string
    '--color-primary-rgb': string
    '--color-text': string
    '--color-text-rgb': string
    '--color-surface': string
    '--color-surface-rgb': string
    '--color-border': string
    '--color-border-rgb': string
    '--color-muted': string
    '--color-muted-rgb': string
    '--font-heading': string
    '--font-body': string
    '--shadow-card': string
    '--shadow-card-lg': string
    '--shadow-card-sm': string
    '--radius-card': string
    '--radius-sm': string
    '--radius-lg': string
    '--radius-xl': string
}

export const themes: Record<Theme, ThemeTokens> = {
    royal: {
        '--color-bg': '#F8F9FB',
        '--color-bg-rgb': '248 249 251',
        '--color-primary': '#1B3A6B',
        '--color-primary-rgb': '27 58 107',
        '--color-text': '#0F2347',
        '--color-text-rgb': '15 35 71',
        '--color-surface': '#EEF1F7',
        '--color-surface-rgb': '238 241 247',
        '--color-border': '#C9A84C',
        '--color-border-rgb': '201 168 76',
        '--color-muted': '#6B7280',
        '--color-muted-rgb': '107 114 128',
        '--font-heading': '"Playfair Display", serif',
        '--font-body': '"Josefin Sans", sans-serif',
        '--shadow-card': '0 4px 20px rgba(27, 58, 107, 0.08)',
        '--shadow-card-lg': '0 12px 40px rgba(27, 58, 107, 0.12)',
        '--shadow-card-sm': '0 2px 8px rgba(27, 58, 107, 0.05)',
        '--radius-card': '12px',
        '--radius-sm': '8px',
        '--radius-lg': '16px',
        '--radius-xl': '24px',
    },
    boho: {
        '--color-bg': '#F5EFE6',
        '--color-bg-rgb': '245 239 230',
        '--color-primary': '#7C9A6E',
        '--color-primary-rgb': '124 154 110',
        '--color-text': '#4A3728',
        '--color-text-rgb': '74 55 40',
        '--color-surface': '#EDE4D8',
        '--color-surface-rgb': '237 228 216',
        '--color-border': '#D4C5B0',
        '--color-border-rgb': '212 197 176',
        '--color-muted': '#8B7355',
        '--color-muted-rgb': '139 115 85',
        '--font-heading': '"Cormorant Garamond", serif',
        '--font-body': '"Nunito", sans-serif',
        '--shadow-card': '0 4px 20px rgba(124, 154, 110, 0.1)',
        '--shadow-card-lg': '0 12px 40px rgba(124, 154, 110, 0.15)',
        '--shadow-card-sm': '0 2px 8px rgba(124, 154, 110, 0.06)',
        '--radius-card': '16px',
        '--radius-sm': '10px',
        '--radius-lg': '20px',
        '--radius-xl': '28px',
    },
    dark: {
        '--color-bg': '#0D0D0D',
        '--color-bg-rgb': '13 13 13',
        '--color-primary': '#C9A84C',
        '--color-primary-rgb': '201 168 76',
        '--color-text': '#F0EAD6',
        '--color-text-rgb': '240 234 214',
        '--color-surface': '#1A1A1A',
        '--color-surface-rgb': '26 26 26',
        '--color-border': '#2E2E2E',
        '--color-border-rgb': '46 46 46',
        '--color-muted': '#9CA3AF',
        '--color-muted-rgb': '156 163 175',
        '--font-heading': '"Cormorant Garamond", serif',
        '--font-body': '"Lato", sans-serif',
        '--shadow-card': '0 4px 20px rgba(0, 0, 0, 0.4)',
        '--shadow-card-lg': '0 12px 40px rgba(0, 0, 0, 0.5)',
        '--shadow-card-sm': '0 2px 8px rgba(0, 0, 0, 0.3)',
        '--radius-card': '12px',
        '--radius-sm': '8px',
        '--radius-lg': '16px',
        '--radius-xl': '24px',
    },
    magnolia: {
        '--color-bg': '#FBF6F0',
        '--color-bg-rgb': '251 246 240',
        '--color-primary': '#B76E79',
        '--color-primary-rgb': '183 110 121',
        '--color-text': '#3D1F28',
        '--color-text-rgb': '61 31 40',
        '--color-surface': '#F2E8E4',
        '--color-surface-rgb': '242 232 228',
        '--color-border': '#C9A27A',
        '--color-border-rgb': '201 162 122',
        '--color-muted': '#8B6F7D',
        '--color-muted-rgb': '139 111 125',
        '--font-heading': '"Cormorant Garamond", serif',
        '--font-body': '"Raleway", sans-serif',
        '--shadow-card': '0 4px 20px rgba(183, 110, 121, 0.1)',
        '--shadow-card-lg': '0 12px 40px rgba(183, 110, 121, 0.15)',
        '--shadow-card-sm': '0 2px 8px rgba(183, 110, 121, 0.06)',
        '--radius-card': '14px',
        '--radius-sm': '9px',
        '--radius-lg': '18px',
        '--radius-xl': '26px',
    },
    linen: {
        '--color-bg': '#FBF9F6',
        '--color-bg-rgb': '251 249 246',
        '--color-primary': '#4A5343',
        '--color-primary-rgb': '74 83 67',
        '--color-text': '#2C3029',
        '--color-text-rgb': '44 48 41',
        '--color-surface': '#F5F3EF',
        '--color-surface-rgb': '245 243 239',
        '--color-border': '#D4C5B0',
        '--color-border-rgb': '212 197 176',
        '--color-muted': '#6B7264',
        '--color-muted-rgb': '107 114 100',
        '--font-heading': '"Playfair Display", serif',
        '--font-body': '"Montserrat", sans-serif',
        '--shadow-card': '0 4px 20px rgba(74, 83, 67, 0.08)',
        '--shadow-card-lg': '0 12px 40px rgba(74, 83, 67, 0.12)',
        '--shadow-card-sm': '0 2px 8px rgba(74, 83, 67, 0.05)',
        '--radius-card': '12px',
        '--radius-sm': '8px',
        '--radius-lg': '16px',
        '--radius-xl': '24px',
    },
}

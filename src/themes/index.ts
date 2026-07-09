export type Theme = 'royal' | 'boho' | 'dark' | 'magnolia' | 'linen'

export type ThemeTokens = {
    '--color-wedding-bg': string
    '--color-wedding-bg-rgb': string
    '--color-wedding-primary': string
    '--color-wedding-primary-rgb': string
    '--color-wedding-text': string
    '--color-wedding-text-rgb': string
    '--color-wedding-surface': string
    '--color-wedding-surface-rgb': string
    '--color-wedding-border': string
    '--color-wedding-border-rgb': string
    '--color-wedding-muted': string
    '--color-wedding-muted-rgb': string
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
        '--color-wedding-bg': '#F8F9FB',
        '--color-wedding-bg-rgb': '248 249 251',
        '--color-wedding-primary': '#1B3A6B',
        '--color-wedding-primary-rgb': '27 58 107',
        '--color-wedding-text': '#0F2347',
        '--color-wedding-text-rgb': '15 35 71',
        '--color-wedding-surface': '#EEF1F7',
        '--color-wedding-surface-rgb': '238 241 247',
        '--color-wedding-border': '#C9A84C',
        '--color-wedding-border-rgb': '201 168 76',
        '--color-wedding-muted': '#6B7280',
        '--color-wedding-muted-rgb': '107 114 128',
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
        '--color-wedding-bg': '#F5EFE6',
        '--color-wedding-bg-rgb': '245 239 230',
        '--color-wedding-primary': '#7C9A6E',
        '--color-wedding-primary-rgb': '124 154 110',
        '--color-wedding-text': '#4A3728',
        '--color-wedding-text-rgb': '74 55 40',
        '--color-wedding-surface': '#EDE4D8',
        '--color-wedding-surface-rgb': '237 228 216',
        '--color-wedding-border': '#D4C5B0',
        '--color-wedding-border-rgb': '212 197 176',
        '--color-wedding-muted': '#8B7355',
        '--color-wedding-muted-rgb': '139 115 85',
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
        '--color-wedding-bg': '#0D0D0D',
        '--color-wedding-bg-rgb': '13 13 13',
        '--color-wedding-primary': '#C9A84C',
        '--color-wedding-primary-rgb': '201 168 76',
        '--color-wedding-text': '#F0EAD6',
        '--color-wedding-text-rgb': '240 234 214',
        '--color-wedding-surface': '#1A1A1A',
        '--color-wedding-surface-rgb': '26 26 26',
        '--color-wedding-border': '#2E2E2E',
        '--color-wedding-border-rgb': '46 46 46',
        '--color-wedding-muted': '#9CA3AF',
        '--color-wedding-muted-rgb': '156 163 175',
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
        '--color-wedding-bg': '#FBF6F0',
        '--color-wedding-bg-rgb': '251 246 240',
        '--color-wedding-primary': '#B76E79',
        '--color-wedding-primary-rgb': '183 110 121',
        '--color-wedding-text': '#3D1F28',
        '--color-wedding-text-rgb': '61 31 40',
        '--color-wedding-surface': '#F2E8E4',
        '--color-wedding-surface-rgb': '242 232 228',
        '--color-wedding-border': '#C9A27A',
        '--color-wedding-border-rgb': '201 162 122',
        '--color-wedding-muted': '#8B6F7D',
        '--color-wedding-muted-rgb': '139 111 125',
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
        '--color-wedding-bg': '#FBF9F6',
        '--color-wedding-bg-rgb': '251 249 246',
        '--color-wedding-primary': '#4A5343',
        '--color-wedding-primary-rgb': '74 83 67',
        '--color-wedding-text': '#2C3029',
        '--color-wedding-text-rgb': '44 48 41',
        '--color-wedding-surface': '#F5F3EF',
        '--color-wedding-surface-rgb': '245 243 239',
        '--color-wedding-border': '#D4C5B0',
        '--color-wedding-border-rgb': '212 197 176',
        '--color-wedding-muted': '#6B7264',
        '--color-wedding-muted-rgb': '107 114 100',
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

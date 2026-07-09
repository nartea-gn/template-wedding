import plugin from 'tailwindcss/plugin'

/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                serif: ['var(--font-heading)', 'Georgia', 'serif'],
                sans: ['var(--font-body)', 'sans-serif'],
            },
            colors: {
                wedding: {
                    bg: 'rgb(var(--color-bg-rgb) / <alpha-value>)',
                    primary: 'rgb(var(--color-primary-rgb) / <alpha-value>)',
                    accent: '#D4AF37',
                    dark: 'rgb(var(--color-text-rgb) / <alpha-value>)',
                    text: 'rgb(var(--color-text-rgb) / <alpha-value>)',
                    surface: 'rgb(var(--color-surface-rgb) / <alpha-value>)',
                    border: 'rgb(var(--color-border-rgb) / <alpha-value>)',
                    muted: 'rgb(var(--color-muted-rgb) / <alpha-value>)',
                    success: '#22c55e',
                    warning: '#f59e0b',
                    error: '#ef4444',
                    info: '#3b82f6',
                }
            },
            boxShadow: {
                'wedding': 'var(--shadow-card)',
                'wedding-lg': 'var(--shadow-card-lg)',
                'wedding-sm': 'var(--shadow-card-sm)',
            },
            borderRadius: {
                'wedding': 'var(--radius-card)',
                'wedding-sm': 'var(--radius-sm)',
                'wedding-lg': 'var(--radius-lg)',
                'wedding-xl': 'var(--radius-xl)',
            },
            spacing: {
                '18': '4.5rem',
                '88': '22rem',
                '128': '32rem',
            },
            transitionDuration: {
                '400': '400ms',
                '600': '600ms',
            },
            animation: {
                'fade-in': 'fadeIn 0.8s ease-out forwards',
                'fade-up': 'fadeUp 0.9s ease both',
                'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
                'shimmer': 'shimmer 2s linear infinite',
            },
            keyframes: {
                fadeIn: {
                    '0%': {opacity: '0', transform: 'translateY(10px)'},
                    '100%': {opacity: '1', transform: 'translateY(0)'},
                },
                fadeUp: {
                    '0%': {opacity: '0', transform: 'translateY(18px)'},
                    '100%': {opacity: '1', transform: 'translateY(0)'},
                },
                pulseSoft: {
                    '0%, 100%': {opacity: '1'},
                    '50%': {opacity: '0.7'},
                },
                shimmer: {
                    '0%': {backgroundPosition: '-200% 0'},
                    '100%': {backgroundPosition: '200% 0'},
                },
            },
            backgroundImage: {
                'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
                'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
            },
        },
    },
    plugins: [
        plugin(({addComponents, addUtilities}) => {
            addComponents({
                '.btn': {
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    fontFamily: 'var(--font-body)',
                    fontSize: '0.78rem',
                    fontWeight: '600',
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    lineHeight: '1',
                    padding: '0.95rem 2.25rem',
                    borderRadius: '999px',
                    border: '1px solid transparent',
                    cursor: 'pointer',
                    textDecoration: 'none',
                    transition: 'all 0.25s ease',
                    position: 'relative',
                    overflow: 'hidden',
                    '&::before': {
                        content: "''",
                        position: 'absolute',
                        top: '0',
                        left: '-100%',
                        width: '100%',
                        height: '100%',
                        background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent)',
                        transition: 'left 0.5s ease',
                    },
                    '&:hover::before': {
                        left: '100%',
                    },
                    '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: 'var(--shadow-card-lg)',
                    },
                    '&:active': {
                        transform: 'translateY(0) scale(0.98)',
                    },
                },
                '.btn--primary': {
                    backgroundColor: 'var(--color-primary)',
                    color: 'var(--color-bg)',
                    borderColor: 'var(--color-primary)',
                    '&:hover': {
                        filter: 'brightness(1.1)',
                    },
                },
                '.btn--outline': {
                    backgroundColor: 'transparent',
                    color: 'var(--color-primary)',
                    borderColor: 'var(--color-primary)',
                    '&:hover': {
                        backgroundColor: 'var(--color-primary)',
                        color: 'var(--color-bg)',
                    },
                },
                '.btn--ghost': {
                    backgroundColor: 'transparent',
                    color: 'var(--color-text)',
                    borderColor: 'transparent',
                    '&:hover': {
                        backgroundColor: 'var(--color-surface)',
                    },
                },
                '.card': {
                    backgroundColor: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-card)',
                    boxShadow: 'var(--shadow-card)',
                    transition: 'box-shadow 0.3s ease, transform 0.3s ease',
                    '&:hover': {
                        boxShadow: 'var(--shadow-card-lg)',
                        transform: 'translateY(-2px)',
                    },
                },
                '.input': {
                    width: '100%',
                    padding: '0.75rem 1rem',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'var(--color-bg)',
                    color: 'var(--color-text)',
                    fontFamily: 'var(--font-body)',
                    fontSize: '0.875rem',
                    transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
                    '&:focus': {
                        outline: 'none',
                        borderColor: 'var(--color-primary)',
                        boxShadow: '0 0 0 3px color-mix(in srgb, var(--color-primary) 10%, transparent)',
                    },
                    '&::placeholder': {
                        color: 'var(--color-muted)',
                        opacity: '0.6',
                    },
                },
                '.label': {
                    display: 'block',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: 'var(--color-text)',
                    marginBottom: '0.5rem',
                },
                '.section-title': {
                    fontFamily: 'var(--font-heading)',
                    fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
                    fontWeight: '600',
                    color: 'var(--color-primary)',
                    lineHeight: '1.2',
                },
                '.section-subtitle': {
                    fontSize: '0.875rem',
                    color: 'var(--color-muted)',
                    letterSpacing: '0.05em',
                },
            })

            addUtilities({
                '.animate-delay-100': {animationDelay: '0.1s'},
                '.animate-delay-200': {animationDelay: '0.2s'},
                '.animate-delay-300': {animationDelay: '0.3s'},
                '.animate-delay-400': {animationDelay: '0.4s'},
                '.animate-delay-500': {animationDelay: '0.5s'},
                '.text-balance': {textWrap: 'balance'},
                '.bg-gradient-wedding': {
                    background: 'linear-gradient(135deg, var(--color-bg) 0%, var(--color-surface) 100%)',
                },
            })
        }),
    ],
}

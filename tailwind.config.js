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
                    bg: 'var(--color-bg)',
                    primary: 'var(--color-primary)',
                    accent: '#D4AF37',
                    dark: 'var(--color-text)',
                    surface: 'var(--color-surface)',
                    border: 'var(--color-border)',
                }
            }
        },
    },
    plugins: [],
}

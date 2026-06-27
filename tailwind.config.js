/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                serif: ['"Playfair Display"', 'Georgia', 'serif'],
                sans: ['"Montserrat"', 'sans-serif'],
            },
            colors: {
                wedding: {
                    bg: '#FBF9F6',      // Fondo lino suave
                    primary: '#4A5343', // Verde oliva elegante
                    accent: '#D4AF37',  // Toques dorados sutiles
                    dark: '#2C3029',    // Texto principal
                }
            }
        },
    },
    plugins: [],
}
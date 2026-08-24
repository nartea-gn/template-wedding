import {defineConfig} from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
    plugins: [react(), tailwindcss()],
    base: '/template-wedding/',
    build: {
        sourcemap: false,
        chunkSizeWarningLimit: 300,
        reportCompressedSize: true,
        rollupOptions: {
            output: {
                manualChunks(id: string) {
                    if (id.includes('node_modules')) {
                        if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
                            return 'vendor-react'
                        }
                        if (id.includes('@supabase')) {
                            return 'vendor-supabase'
                        }
                        return 'vendor'
                    }
                    if (id.includes('src/themes')) {
                        return 'theme'
                    }
                },
            },
        },
    },
})

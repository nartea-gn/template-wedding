import react from '@vitejs/plugin-react'
import {defineConfig} from 'vitest/config'

export default defineConfig({
    plugins: [react()],
    test: {
        environment: 'jsdom',
        // NOT `vmThreads`. Vitest reports jsdom setup as ~73% of tracked time and suggests that
        // pool, and it does cut the suite from 11.96s to 1.92s -- but it shares one context
        // between files, and under it `AppRouter.test.tsx` hangs on the lazy `/rsvp` chunk: the
        // Suspense fallback never resolves and both of its cases fail. Measured: 164/164 under
        // `forks` and under `threads`, 163/164 under `vmThreads`, deterministically. Ten seconds
        // is not worth a suite that only fails in the configuration we chose for speed.
        setupFiles: ['./src/test/setup.ts'],
        include: ['src/**/*.test.{ts,tsx}'],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'html'],
            include: ['src/**/*.{ts,tsx}'],
            exclude: ['src/test/**', 'src/**/*.test.{ts,tsx}', 'src/vite-env.d.ts'],
        },
    },
})

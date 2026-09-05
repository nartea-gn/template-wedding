import {defineConfig, devices} from '@playwright/test'

/**
 * A config of its own because this suite needs the built application, and the main one serves
 * `pnpm dev`. Sharing a `webServer` would force every Pull Request to build before its fast gate;
 * a second port keeps both runnable at once.
 */
export default defineConfig({
    testDir: './e2e',
    testMatch: /csp\.spec\.ts/,
    timeout: 45_000,
    expect: {timeout: 10_000},
    fullyParallel: true,
    forbidOnly: Boolean(process.env.CI),
    retries: process.env.CI ? 1 : 0,
    workers: 2,
    reporter: process.env.CI ? [['github'], ['html', {open: 'never'}]] : 'list',
    use: {
        baseURL: 'http://127.0.0.1:4174/',
        trace: 'retain-on-failure',
        screenshot: 'only-on-failure',
    },
    projects: [{name: 'chromium', use: {...devices['Desktop Chrome']}}],
    webServer: {
        // `wrangler pages dev`, not `vite preview`: the policy now travels as a response header
        // emitted from `_headers`, and only Cloudflare's own server applies that file.
        command: 'pnpm run build && pnpm exec wrangler pages dev dist --ip 127.0.0.1 --port 4174',
        url: 'http://127.0.0.1:4174/',
        reuseExistingServer: false,
        timeout: 120_000,
        env: {
            VITE_SUPABASE_URL: 'http://127.0.0.1:54321',
            VITE_SUPABASE_ANON_KEY: 'e2e-anon-key',
        },
    },
})

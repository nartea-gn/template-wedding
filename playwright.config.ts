import {defineConfig, devices} from '@playwright/test'

// `csp.spec.ts` is served by `playwright.csp.config.ts` against the build; the dev server this
// config runs carries no policy, so collecting that spec here fails on its first assertion.
const CSP_SUITE = /csp\.spec\.ts/

// A project-level `testIgnore` REPLACES the top-level one rather than adding to it, so every
// project that narrows the list further has to restate the CSP exclusion. Forgetting it is silent:
// the spec is simply collected against the wrong server.
const CSP_AND_MATRIX_SUITES = /(csp|responsive|themes)\.spec\.ts/

export default defineConfig({
    testDir: './e2e',
    testIgnore: CSP_SUITE,
    timeout: 45_000,
    expect: {
        timeout: 10_000,
    },
    fullyParallel: true,
    forbidOnly: Boolean(process.env.CI),
    retries: process.env.CI ? 1 : 0,
    workers: 2,
    reporter: process.env.CI ? [['github'], ['html', {open: 'never'}]] : 'list',
    use: {
        baseURL: 'http://127.0.0.1:4173/',
        // Pinned because `admin.spec.ts` asserts the wall clock an administrator in Spain reads in
        // the `datetime-local` deadline: the stored instant is UTC and the control renders it in
        // local time, so an unpinned runner turns 23:59 into 21:59 on CI and passes only in
        // Europe/Madrid. The `devices` descriptors set no `timezoneId`, so every project inherits
        // this one.
        timezoneId: 'Europe/Madrid',
        trace: 'retain-on-failure',
        screenshot: 'only-on-failure',
        video: 'retain-on-failure',
    },
    projects: [
        {
            name: 'chromium',
            use: {...devices['Desktop Chrome']},
        },
        {
            name: 'firefox',
            testIgnore: CSP_AND_MATRIX_SUITES,
            use: {...devices['Desktop Firefox']},
        },
        {
            name: 'webkit',
            testIgnore: CSP_AND_MATRIX_SUITES,
            use: {...devices['Desktop Safari']},
        },
        {
            name: 'mobile-chrome',
            testIgnore: CSP_AND_MATRIX_SUITES,
            use: {...devices['Pixel 5']},
        },
        {
            name: 'mobile-webkit',
            testIgnore: CSP_AND_MATRIX_SUITES,
            use: {...devices['iPhone 13']},
        },
    ],
    webServer: {
        command: 'pnpm run dev --host 127.0.0.1 --port 4173',
        url: 'http://127.0.0.1:4173/',
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
        env: {
            VITE_SUPABASE_URL: 'http://127.0.0.1:54321',
            VITE_SUPABASE_ANON_KEY: 'e2e-anon-key',
        },
    },
})

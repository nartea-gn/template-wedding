/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_SUPABASE_URL: string
    readonly VITE_SUPABASE_ANON_KEY: string
    /**
     * The couple, read by `src/invitations/wedding/couple.ts`.
     *
     * All optional: absent means the template's own names render, which is what keeps CI and a
     * bare checkout green. The `_BG` variants exist because Bulgarian transliterates the names and
     * one variable cannot hold two scripts.
     */
    readonly VITE_PARTNER_ONE?: string
    readonly VITE_PARTNER_TWO?: string
    readonly VITE_SURNAME_ONE?: string
    readonly VITE_SURNAME_TWO?: string
    readonly VITE_PARTNER_ONE_BG?: string
    readonly VITE_PARTNER_TWO_BG?: string
    readonly VITE_SURNAME_ONE_BG?: string
    readonly VITE_SURNAME_TWO_BG?: string
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}

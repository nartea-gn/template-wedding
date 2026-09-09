/**
 * The project's API origin and public key, validated once.
 *
 * Separate from `supabaseClient` so a module can address the API without pulling
 * `@supabase/supabase-js` in with it. The landing page needs one RPC and nothing else; importing
 * the client for it put a 200 KiB chunk on the critical path of the page every guest opens.
 */
const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
    throw new Error('Missing Supabase environment variables.');
}

export const supabaseUrl: string = url;
export const supabaseAnonKey: string = anonKey;

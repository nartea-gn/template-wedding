import {createClient} from '@supabase/supabase-js';
import {supabaseAnonKey, supabaseUrl} from './supabaseConfig';

/**
 * Client for the administrative panel, which needs the couple's session.
 *
 * Persists that session, so every request it makes after a login carries the JWT and reaches the
 * database as `authenticated`.
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Client for the guest-facing submission, which must never carry a session.
 *
 * `rsvp_responses_insert_anon` and the `rsvp_responses_id_seq` grant name `anon` only, so a
 * request made as `authenticated` is refused twice over -- `permission denied for table
 * rsvp_responses`, then `permission denied for sequence rsvp_responses_id_seq`. Sharing one
 * client with the panel meant that opening `/admin` in a browser silently broke `/rsvp` in the
 * same browser, which is how the couple's own test of their own form failed.
 */
export const supabasePublic = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        // Clave propia. Con la misma que el cliente del panel, gotrue avisaba en cada carga de
        // `/rsvp` y de `/admin`: "Multiple GoTrueClient instances detected in the same browser
        // context". Dos instancias son deliberadas aqui -- una con sesion para la pareja y otra
        // sin ella para el invitado -- pero deben mirar a sitios distintos.
        storageKey: 'sb-nartea-public',
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
    },
});

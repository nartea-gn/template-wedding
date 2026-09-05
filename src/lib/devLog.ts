/**
 * Console output that never runs outside development.
 *
 * Supabase rejects carry the failing request, and in the admin hooks that request holds guest
 * answers -- dietary needs among them. Writing those to the console of a shared laptop is a
 * disclosure the UI never intended, so the guard lives here instead of depending on every call
 * site to remember it. `import.meta.env.DEV` is inlined at build time, so the branch is dropped.
 */

/**
 * Reports a failure that the user already sees handled in the interface.
 */
export function devError(message: string, cause?: unknown): void {
    if (import.meta.env.DEV) console.error(message, cause)
}

/**
 * Reports a degraded path the application recovered from on its own.
 */
export function devWarn(message: string, cause?: unknown): void {
    if (import.meta.env.DEV) console.warn(message, cause)
}

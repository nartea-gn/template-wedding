/**
 * Raised when no invitation is registered for the slug the client submitted.
 *
 * A deployment problem, not a guest problem: `scripts/sync-invitation.ts` has not run against the
 * project. It is separate from {@link RsvpClosedError} because the two used to arrive as the same
 * SQLSTATE, so a project with no `invitations` row told every guest the deadline had passed and
 * offered no way to retry.
 */
export class RsvpUnregisteredError extends Error {
    constructor() {
        super('No invitation is registered for this wedding slug.')
        this.name = 'RsvpUnregisteredError'
    }
}

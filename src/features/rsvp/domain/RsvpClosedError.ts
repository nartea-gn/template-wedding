/**
 * Raised when the database refused a submission because the RSVP is closed.
 *
 * The interface can be wrong about the deadline — the couple may have closed the form from
 * their panel seconds ago — so the guest must be told "the deadline has passed" rather than
 * shown an undifferentiated submission failure.
 */
export class RsvpClosedError extends Error {
    constructor() {
        super('The RSVP is closed for this invitation.')
        this.name = 'RsvpClosedError'
    }
}

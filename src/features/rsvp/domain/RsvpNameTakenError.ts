/**
 * Raised when the name the guest typed already has an answer for this wedding.
 *
 * Not a failure: the database cannot tell from a name whether this is the same person coming back
 * to correct their answer or a second guest who happens to share it, so it refuses to choose. The
 * form asks, and resubmits with the intent the guest states.
 *
 * Before 20260911 the database assumed the first case and overwrote the row, which meant a guest
 * called Ana López could erase another Ana López's menu, bus seat and message while being told
 * her own submission had been saved.
 */
export class RsvpNameTakenError extends Error {
    constructor() {
        super('A response already exists under this name.')
        this.name = 'RsvpNameTakenError'
    }
}

/**
 * Raised when a correction arrives for a name several guests now share.
 *
 * No row can be identified from the name alone, and picking one would be the overwrite this whole
 * mechanism exists to prevent. The guest is pointed at the couple, who can see the rows and tell
 * them apart.
 */
export class RsvpAmbiguousNameError extends Error {
    constructor() {
        super('Several responses share this name; the row cannot be identified.')
        this.name = 'RsvpAmbiguousNameError'
    }
}

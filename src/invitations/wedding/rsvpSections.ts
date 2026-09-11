/**
 * Which optional blocks of the RSVP this wedding asks for.
 *
 * A wedding without a coach does not ask about seats on it, and one without a DJ does not ask for
 * songs. Before this, every couple deploying the template got all three questions and had to live
 * with a column of dashes in their panel -- or edit the form definition, which is the shape the
 * template exists to avoid.
 *
 * Declared here and not in the environment on purpose: this is a decision per wedding, not per
 * deployment, and a misspelt `VITE_` variable would silently hide a section instead of failing.
 * The diff shows which wedding asks what, and `pnpm run quality` proves the form still builds.
 *
 * `dietary` also governs the article 9 notice that travels with it: turning it off removes the
 * health question and the consent text together, which is the only correct way to remove either.
 */
export const weddingRsvpSections = {
    /** Allergies and intolerances. Their own step. */
    dietary: true,
    /** Seat on the coach. Shares a step with {@link song}. */
    bus: true,
    /** A song for the dance floor. Shares a step with {@link bus}. */
    song: true,
} as const

export type WeddingRsvpSections = typeof weddingRsvpSections

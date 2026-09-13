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
 *
 * `menu` is deliberately not covered by that notice. Beef or fish is a preference and a child's
 * menu is an age, so neither is health data: putting them under the article 9 text would claim a
 * consent nothing there needs, and dilute the one the allergies do need.
 */
export const weddingRsvpSections = {
    /** Which menu the guest eats. Its own block, above the allergies. */
    menu: true,
    /** Allergies and intolerances. Shares the logistics step, under its own label. */
    dietary: true,
    /** Seat on the coach. Shares the logistics step, under its own label. */
    bus: true,
    /** A song for the dance floor. The whole last step is this one question. */
    song: true,
} as const

export type WeddingRsvpSections = typeof weddingRsvpSections

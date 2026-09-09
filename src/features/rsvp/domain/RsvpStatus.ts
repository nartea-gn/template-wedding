/**
 * Live RSVP schedule for one invitation, as resolved by the database.
 *
 * The compiled `capabilities.rsvp.deadline` is only a starting value; this is the authoritative
 * one, and the couple can change it from the admin panel without a redeploy.
 */
export type RsvpStatus = {
    isOpen: boolean
    deadlineUtc: string | null
    /**
     * The persisted manual switch, or `null` when the deadline decides.
     *
     * Carried separately from {@link RsvpStatus.isOpen} because two consumers need the cause and
     * not only the effect: the admin panel renders the switch in the position the couple left it,
     * and the local deadline timer must not close a form the couple deliberately reopened.
     */
    override: 'open' | 'closed' | null
}

/**
 * Schedule change requested from the admin panel.
 *
 * `override` is the manual switch: `'open'` and `'closed'` beat the deadline, `null` hands the
 * decision back to it.
 */
export type RsvpScheduleUpdate = {
    deadlineUtc?: string
    override?: 'open' | 'closed' | null
}

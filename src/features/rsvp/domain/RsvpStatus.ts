/**
 * Live RSVP schedule for one invitation, as resolved by the database.
 *
 * The compiled `capabilities.rsvp.deadline` is only a starting value; this is the authoritative
 * one, and the couple can change it from the admin panel without a redeploy.
 */
export type RsvpStatus = {
    isOpen: boolean
    deadlineUtc: string | null
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

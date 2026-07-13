import type {AdminSortOrder} from '../../../core/invitation'
import type {RsvpSubmissionRecord} from '../../rsvp/domain/RsvpSubmission'

export type AdminFilter = 'all' | 'confirmed' | 'declined' | 'bus'

type Metrics = {
    attendanceFieldId: string
    transportFieldId?: string
    ownTransportValue?: string
}

export function isAttending(response: RsvpSubmissionRecord, metrics: Metrics | undefined) {
    return metrics ? response.answers[metrics.attendanceFieldId] === true : false
}

export function needsTransport(response: RsvpSubmissionRecord, metrics: Metrics | undefined) {
    if (!metrics?.transportFieldId || !isAttending(response, metrics)) return false
    const value = response.answers[metrics.transportFieldId]
    return Boolean(value) && value !== metrics.ownTransportValue
}

type Arguments = {
    responses: readonly RsvpSubmissionRecord[]
    filter: AdminFilter
    query: string
    sortOrder: AdminSortOrder
    identityFieldId: string
    metrics: Metrics | undefined
    locale: string
}

export function getPresentedResponses({
                                          responses,
                                          filter,
                                          query,
                                          sortOrder,
                                          identityFieldId,
                                          metrics,
                                          locale,
                                      }: Arguments) {
    const normalizedQuery = query.trim().toLocaleLowerCase(locale)
    const collator = new Intl.Collator(locale, {sensitivity: 'base', numeric: true})
    const filtered = responses.filter(response => {
        if (filter === 'confirmed' && !isAttending(response, metrics)) return false
        if (filter === 'declined' && isAttending(response, metrics)) return false
        if (filter === 'bus' && !needsTransport(response, metrics)) return false
        if (!normalizedQuery) return true
        return String(response.answers[identityFieldId] ?? '').toLocaleLowerCase(locale).includes(normalizedQuery)
    })
    return [...filtered].sort((left, right) => {
        if (sortOrder === 'newest') return Date.parse(right.createdAt) - Date.parse(left.createdAt)
        if (sortOrder === 'oldest') return Date.parse(left.createdAt) - Date.parse(right.createdAt)
        const comparison = collator.compare(
            String(left.answers[identityFieldId] ?? ''),
            String(right.answers[identityFieldId] ?? ''),
        )
        return sortOrder === 'identity-desc' ? -comparison : comparison
    })
}

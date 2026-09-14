import type {AdminSortOrder} from '../../../core/invitation'
import type {RsvpSubmissionRecord} from '../../rsvp/domain/RsvpSubmission'

/**
 * Que subconjunto de respuestas se esta mirando.
 *
 * Los seis primeros son vistas fijas. `choice:<campo>:<valor>` es una familia: filtra por lo que
 * un invitado eligio en un campo de opcion, y quien la declara es la invitacion, no este tipo. El
 * caso que la pidio es sacar la lista de quien come pescado sin exportar el CSV y filtrarlo fuera.
 */
export type AdminFilter =
    | 'all' | 'confirmed' | 'declined' | 'bus' | 'dietary' | 'deleted'
    | `choice:${string}`

/** El campo y el valor que codifica un filtro `choice:`, o `null` si no lo es. */
export function parseChoiceFilter(filter: AdminFilter) {
    if (!filter.startsWith('choice:')) return null
    const resto = filter.slice('choice:'.length)
    const corte = resto.indexOf(':')
    if (corte <= 0) return null
    return {fieldId: resto.slice(0, corte), value: resto.slice(corte + 1)}
}

/**
 * Whether a response still counts.
 *
 * A soft-deleted row stays in the fetched array so the couple can restore it, and that is the
 * whole reason `listByInvitation` does not filter it away. It used to leak into everything else:
 * the headline counts, the result count and the CSV all walked the raw array, so the panel
 * reported 60 responses and 48 attending where the database held 58 and 46, and the export the
 * panel's own notice says to hand the caterer carried two guests the couple had removed.
 */
export function isLive(response: RsvpSubmissionRecord) {
    return !response.deletedAt
}

type Metrics = {
    attendanceFieldId: string
    transportFieldId?: string
    ownTransportValue?: string
    /** Campos que, con valor, significan que ese invitado necesita algo del catering. */
    dietaryFieldIds?: readonly string[]
    /** Campos de eleccion unica cuyo reparto se cuenta. */
    breakdownFieldIds?: readonly string[]
}

/** Cuantos invitados que asisten han elegido cada valor de un campo. */
export type Tally = Readonly<Record<string, number>>

/**
 * El reparto de un campo de eleccion entre quienes asisten.
 *
 * Solo cuenta a quien viene: el menu de quien declina no se cocina, y sumarlo daria al catering un
 * numero mayor que el de comensales. Un valor vacio no cuenta como categoria propia -- si la
 * pregunta es obligatoria no lo habra, y si no lo es, el hueco se lee restando del total de
 * asistentes, que es la cifra que ya esta en pantalla justo encima.
 */
export function tallyField(
    responses: readonly RsvpSubmissionRecord[],
    fieldId: string,
    metrics: Metrics | undefined,
): Tally {
    const tally: Record<string, number> = {}
    for (const response of responses) {
        if (!isLive(response) || !isAttending(response, metrics)) continue
        const value = response.answers[fieldId]
        if (value === undefined || value === null || value === '') continue
        const key = String(value)
        tally[key] = (tally[key] ?? 0) + 1
    }
    return tally
}

export function isAttending(response: RsvpSubmissionRecord, metrics: Metrics | undefined) {
    return metrics ? response.answers[metrics.attendanceFieldId] === true : false
}

export function needsTransport(response: RsvpSubmissionRecord, metrics: Metrics | undefined) {
    if (!metrics?.transportFieldId || !isAttending(response, metrics)) return false
    const value = response.answers[metrics.transportFieldId]
    return Boolean(value) && value !== metrics.ownTransportValue
}

/**
 * Si el invitado ha declarado alguna necesidad alimentaria.
 *
 * "Quien necesita sin gluten" era la pregunta que el panel no podia responder: los filtros eran
 * todos/confirmados/declinados/bus, asi que la pregunta del catering obligaba a mirar seis
 * paginas a mano. Cuenta cualquier valor no vacio en los campos declarados, salvo la opcion
 * excluyente "ninguna", que significa justamente lo contrario.
 */
export function needsDiet(response: RsvpSubmissionRecord, metrics: Metrics | undefined) {
    if (!metrics?.dietaryFieldIds?.length || !isAttending(response, metrics)) return false
    return metrics.dietaryFieldIds.some(id => {
        const value = response.answers[id]
        if (Array.isArray(value)) return value.some(item => item !== 'none')
        return typeof value === 'string' ? value.trim() !== '' : false
    })
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

export function getPresentedResponses(
    {
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
        // `deleted` is the only view of the removed rows, and every other view excludes them.
        if (filter === 'deleted' ? isLive(response) : !isLive(response)) return false
        if (filter === 'confirmed' && !isAttending(response, metrics)) return false
        if (filter === 'declined' && isAttending(response, metrics)) return false
        if (filter === 'bus' && !needsTransport(response, metrics)) return false
        if (filter === 'dietary' && !needsDiet(response, metrics)) return false
        // Solo entre quienes asisten, por la misma razon que el recuento: el menu de quien declina
        // no se cocina, y su respuesta vieja seguiria en la fila si cambio de idea.
        const choice = parseChoiceFilter(filter)
        if (choice && (!isAttending(response, metrics)
            || String(response.answers[choice.fieldId] ?? '') !== choice.value)) return false
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

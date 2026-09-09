/**
 * @param variant Que subconjunto se exporta, para que el nombre lo diga.
 *
 * Sin el, exportar "todos" y despues "confirmados" el mismo dia producia dos ficheros con el
 * mismo nombre: el segundo se guardaba como una copia y no habia forma de saber cual era cual.
 * La hora se anade por el mismo motivo, para dos exportaciones del mismo subconjunto.
 */
export function downloadCsv(content: string, invitationId: string, date = new Date(), variant?: string) {
    const safeId = invitationId.replace(/[^a-z0-9-_]/gi, '-').replace(/-+/g, '-')
    const stamp = date.toISOString().slice(0, 16).replace('T', '-').replace(':', '')
    const safeVariant = variant ? `-${variant.replace(/[^a-z0-9-_]/gi, '-')}` : ''
    const filename = `${safeId || 'invitation'}-rsvp${safeVariant}-${stamp}.csv`
    const url = URL.createObjectURL(new Blob([content], {type: 'text/csv;charset=utf-8'}))
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.append(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
}

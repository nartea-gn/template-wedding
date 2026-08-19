export function downloadJson(content: string, invitationId: string, date = new Date()) {
    const safeId = invitationId.replace(/[^a-z0-9-_]/gi, '-').replace(/-+/g, '-')
    const filename = `${safeId || 'invitation'}-rsvp-${date.toISOString().slice(0, 10)}.json`
    const url = URL.createObjectURL(new Blob([content], {type: 'application/json;charset=utf-8'}))
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.append(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
}

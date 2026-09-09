import {Link} from 'react-router-dom'
import type {SectionComponentProps} from '../../../app/invitation'
import {useLocalization} from '../../../app/providers/useLocalization'
import {useRsvpAvailability, useRsvpDeadline} from '../../rsvp/hooks/useRsvpAvailability'

export function RsvpCtaSection<Message extends string>({
                                                           section,
                                                           event,
                                                           capabilities,
                                                       }: Readonly<SectionComponentProps<Message, 'rsvp-cta'>>) {
    const {t, formatDate} = useLocalization<Message>()
    const isOpen = useRsvpAvailability(capabilities.rsvp)
    const deadline = useRsvpDeadline(capabilities.rsvp)
    const deadlineNotice = deadline && section.content.deadlineNotice
        ? t(section.content.deadlineNotice).replace(
            '{date}', formatDate(deadline, {year: 'numeric', month: 'long', day: 'numeric'}))
        : undefined
    return (
        <section className="landing-cta">
            {/* Cerrado no es lo mismo que inoperante. Un boton deshabilitado dejaba al invitado
                sin salida y sin explicacion; el enlace lleva a la pagina que cuenta que el plazo
                termino y ofrece la vuelta a la invitacion. La ruta sigue registrada mientras la
                capability este activa, asi que llega a esa pagina y no al comodin. */}
            <Link to="/rsvp" className="landing-cta-btn btn btn--primary">
                {t(isOpen ? section.content.label : section.content.closedLabel)}
            </Link>
            {/* La fecha, junto a la accion. Antes solo existia en la configuracion. */}
            {isOpen && deadlineNotice && <p className="landing-cta-deadline">{deadlineNotice}</p>}
            {section.content.closing && event.hashtag && (
                <p className="landing-hashtag">{event.hashtag}</p>
            )}
        </section>
    )
}

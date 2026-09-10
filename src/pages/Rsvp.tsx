import {useState} from 'react';
import {Link, useNavigate} from 'react-router-dom';
import type {FormAnswers} from '../core/forms';
import {FormEngine} from '../features/forms/FormEngine';
import {useRsvpSubmission} from '../features/rsvp/hooks/useRsvpSubmission';
import {useLocalization} from '../app/providers/useLocalization';
import {weddingInvitation, type WeddingMessageKey} from '../invitations/wedding';
import {weddingRsvpRepository} from '../invitations/wedding/rsvpRepository';
import {InterfaceIcon} from '../components/ui/InterfaceIcon';
import {formatResponseValue, getFormFields} from '../features/admin/presentation/responsePresentation';
import {useRsvpAvailability} from '../features/rsvp/hooks/useRsvpAvailability';
import './Rsvp.css';

const rsvpCapability = weddingInvitation.capabilities.rsvp;

export default function Rsvp() {
    const navigate = useNavigate();
    const {locale, t} = useLocalization<WeddingMessageKey>();
    const submission = useRsvpSubmission(weddingRsvpRepository);
    const [submittedAnswers, setSubmittedAnswers] = useState<FormAnswers>();
    const available = useRsvpAvailability(rsvpCapability);

    // Defensive only, and what narrows `rsvpCapability` for the rest of this component: the
    // route is not registered at all when the capability is off, so the wildcard answers instead
    // of this returning nothing and painting a blank page.
    if (!rsvpCapability?.enabled) return null;
    // `submission.isClosed` covers the case the interface cannot know about: the couple closed
    // the form from their panel while this page was already open. The database is the authority.
    const isOpen = available && !submission.isClosed;

    // Article 13 requires naming the controller and their contact address. `t` takes a key and
    // nothing else, so the two values are substituted here rather than widening that contract.
    const privacyNotice = rsvpCapability?.form.privacyNotice
        ? t(rsvpCapability.form.privacyNotice)
            .replace('{controller}', t(weddingInvitation.controller.name))
            .replace('{email}', weddingInvitation.controller.email)
        : undefined

    const handleSubmit = async (answers: FormAnswers) => {
        setSubmittedAnswers(answers);
        await submission.submit({
            invitationId: weddingInvitation.id,
            formId: rsvpCapability.form.id,
            formVersion: rsvpCapability.form.version,
            locale,
            answers,
        });
    };

    if (!isOpen) {
        return (
            <div className="rsvp-closed-page">
                {/* Composicion propia: compartia las clases del estado de exito -- y hasta el
                    string de su boton -- asi que el pico emocional y el rechazo social recibian
                    el mismo tratamiento. */}
                <div className="card rsvp-closed-card">
                    <InterfaceIcon name="lock" className="rsvp-closed-icon"/>
                    <h1 className="rsvp-closed-title">{t('rsvp.closed.title')}</h1>
                    <p className="rsvp-closed-text">{t('rsvp.closed.text')}</p>
                    {/* Un humano a quien escribir. El correo estaba en la configuracion y en el
                        aviso de privacidad del formulario abierto, y se le negaba justo a quien
                        llega tarde y lo necesita. */}
                    <p className="rsvp-closed-contact">
                        {t('rsvp.closed.contact').replace('{email}', weddingInvitation.controller.email)}
                    </p>
                    <Link to="/" className="btn btn--outline rsvp-closed-btn">
                        {t('rsvp.success.home')}
                    </Link>
                </div>
            </div>
        );
    }

    if (submission.isSuccess && submittedAnswers) {
        // Recibo de lo que acaba de enviar, resuelto a etiquetas con los mismos helpers que usa la
        // tabla del panel. Un invitado que acaba de comprometerse socialmente recibia una tarjeta
        // de 440x330 con una frase y un boton de contorno: la ultima pantalla del producto era la
        // peor, y es la que se recuerda y la que se manda por captura a la pareja.
        // Desde el `Map` de `getFormFields`, que conserva el orden de los pasos y ya trae el tipo
        // ensanchado: recorrer `steps` otra vez no compila, porque las tuplas literales de cada
        // paso no se unifican en un `flatMap`.
        const fields = getFormFields(rsvpCapability.form);
        const receipt = [...fields.values()]
            .filter(element => element.type !== 'info')
            .map(element => ({
                id: element.id,
                label: t(element.label),
                value: formatResponseValue(submittedAnswers[element.id], fields.get(element.id), t,
                    {yes: 'common.yes', no: 'common.no'}),
            }))
            .filter(entry => entry.value !== '—');

        return (
            <div className="rsvp-confirmed-page">
                <div className="card rsvp-confirmed-card">
                    {/* El mismo ornamento del hero: la pantalla que cierra el recorrido habla el
                        idioma visual del que lo abrio. */}
                    <div className="landing-ornament" aria-hidden="true">
                        <span className="landing-ornament-line"/>
                        <InterfaceIcon name="rings" className="landing-ornament-icon"/>
                        <span className="landing-ornament-line"/>
                    </div>
                    <h1 className="rsvp-confirmed-title">{t('rsvp.success.title')}</h1>
                    <p className="rsvp-confirmed-lead">
                        {submittedAnswers.attending
                            ? t('rsvp.success.attending')
                            : t('rsvp.success.declined')}
                    </p>

                    {receipt.length > 0 && (
                        <section className="rsvp-confirmed-receipt" aria-labelledby="rsvp-receipt">
                            <h2 id="rsvp-receipt" className="label">{t('rsvp.confirmed.receipt')}</h2>
                            <dl className="rsvp-confirmed-list">
                                {receipt.map(entry => (
                                    <div key={entry.id} className="rsvp-confirmed-row">
                                        <dt className="rsvp-confirmed-term">{entry.label}</dt>
                                        <dd className="rsvp-confirmed-value">{entry.value}</dd>
                                    </div>
                                ))}
                            </dl>
                        </section>
                    )}

                    {/* La regla del upsert se contaba en el paso 1 y no aqui, que es donde importa:
                        el invitado ya ha enviado y quiere saber si puede rectificar. */}
                    <p className="rsvp-confirmed-edit">{t('rsvp.fullName.help')}</p>

                    <div className="rsvp-confirmed-actions">
                        <button
                            type="button"
                            onClick={() => {
                                submission.reset();
                                navigate('/');
                            }}
                            className="btn btn--primary"
                        >
                            {t('rsvp.success.home')}
                        </button>
                        {weddingInvitation.event.hashtag && (
                            <p className="rsvp-confirmed-hashtag">{t(weddingInvitation.event.hashtag)}</p>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="rsvp-page">
            <FormEngine
                definition={rsvpCapability.form}
                headingLevel={1}
                privacyNotice={privacyNotice}
                isSubmitting={submission.isLoading}
                hasSubmissionError={Boolean(submission.error)}
                onSubmit={handleSubmit}
            />
        </div>
    );
}

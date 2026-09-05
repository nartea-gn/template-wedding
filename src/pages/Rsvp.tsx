import {useState} from 'react';
import {Link, useNavigate} from 'react-router-dom';
import type {FormAnswers} from '../core/forms';
import {FormEngine} from '../features/forms/FormEngine';
import {useRsvpSubmission} from '../features/rsvp/hooks/useRsvpSubmission';
import {useLocalization} from '../app/providers/useLocalization';
import {weddingInvitation, type WeddingMessageKey} from '../invitations/wedding';
import {weddingRsvpRepository} from '../invitations/wedding/rsvpRepository';
import {InterfaceIcon} from '../components/ui/InterfaceIcon';
import {useRsvpAvailability} from '../features/rsvp/hooks/useRsvpAvailability';
import './Rsvp.css';

const rsvpCapability = weddingInvitation.capabilities.rsvp;

export default function Rsvp() {
    const navigate = useNavigate();
    const {locale, t} = useLocalization<WeddingMessageKey>();
    const submission = useRsvpSubmission(weddingRsvpRepository);
    const [submittedAnswers, setSubmittedAnswers] = useState<FormAnswers>();
    const available = useRsvpAvailability(rsvpCapability);

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
            <div className="rsvp-success-page">
                <div className="card rsvp-success-card">
                    <InterfaceIcon name="lock" className="rsvp-success-icon"/>
                    <h2 className="rsvp-success-title">{t('rsvp.closed.title')}</h2>
                    <p className="rsvp-success-text">{t('rsvp.closed.text')}</p>
                    <Link to="/" className="btn btn--outline rsvp-success-btn">
                        {t('rsvp.success.home')}
                    </Link>
                </div>
            </div>
        );
    }

    if (submission.isSuccess && submittedAnswers) {
        return (
            <div className="rsvp-success-page">
                <div className="card rsvp-success-card">
                    <InterfaceIcon name="sparkles" className="rsvp-success-icon"/>
                    <h2 className="rsvp-success-title">{t('rsvp.success.title')}</h2>
                    <p className="rsvp-success-text">
                        {submittedAnswers.attending
                            ? t('rsvp.success.attending')
                            : t('rsvp.success.declined')}
                    </p>
                    <button
                        type="button"
                        onClick={() => {
                            submission.reset();
                            navigate('/');
                        }}
                        className="btn btn--outline rsvp-success-btn"
                    >
                        {t('rsvp.success.home')}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="rsvp-page">
            <FormEngine
                definition={rsvpCapability.form}
                privacyNotice={privacyNotice}
                isSubmitting={submission.isLoading}
                hasSubmissionError={Boolean(submission.error)}
                onSubmit={handleSubmit}
            />
        </div>
    );
}

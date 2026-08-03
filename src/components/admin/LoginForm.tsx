import {type FormEvent, useEffect, useState} from 'react';
import './LoginForm.css';
import {useLocalization} from '../../app/providers/useLocalization';
import type {WeddingMessageKey} from '../../invitations/wedding';
import {InterfaceIcon} from '../ui/InterfaceIcon';
import type {AdminAuthError, AdminAuthPhase} from '../../hooks/useAdminSession';

type LoginFormProps = {
    title: string;
    phase: Extract<AdminAuthPhase, 'email' | 'code'>;
    requestedEmail: string;
    error: AdminAuthError;
    submitting: boolean;
    onRequestCode: (email: string) => Promise<boolean>;
    onVerifyCode: (code: string) => Promise<boolean>;
    onChangeEmail: () => void;
};

const RESEND_DELAY_SECONDS = 60;

export function LoginForm({
                              title,
                              phase,
                              requestedEmail,
                              error,
                              submitting,
                              onRequestCode,
                              onVerifyCode,
                              onChangeEmail,
                          }: LoginFormProps) {
    const {t} = useLocalization<WeddingMessageKey>();
    const [email, setEmail] = useState('');
    const [code, setCode] = useState('');
    const [resendSeconds, setResendSeconds] = useState(RESEND_DELAY_SECONDS);

    useEffect(() => {
        if (phase !== 'code' || resendSeconds <= 0) return;
        const timer = window.setTimeout(() => setResendSeconds(value => value - 1), 1000);
        return () => window.clearTimeout(timer);
    }, [phase, resendSeconds]);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (phase === 'email') {
            const sent = await onRequestCode(email);
            if (sent) {
                setCode('');
                setResendSeconds(RESEND_DELAY_SECONDS);
            }
            return;
        }
        await onVerifyCode(code);
    };

    const handleResend = async () => {
        if (resendSeconds > 0) return;
        const sent = await onRequestCode(requestedEmail);
        if (sent) setResendSeconds(RESEND_DELAY_SECONDS);
    };

    const handleChangeEmail = () => {
        setCode('');
        onChangeEmail();
    };

    const errorMessage = error === 'request'
        ? t('admin.auth.requestError')
        : error === 'verification'
            ? t('admin.auth.codeInvalid')
            : error === 'session'
                ? t('admin.auth.sessionError')
                : null;

    return (
        <div className="login-page">
            <div className="card login-card">
                <div className="login-heading">
                    <InterfaceIcon name="lock" className="login-icon"/>
                    <h1 className="login-title">
                        {title}
                    </h1>
                    <p className="login-description">
                        {phase === 'email' ? t('admin.auth.emailDescription') : t('admin.auth.codeDescription')}
                    </p>
                </div>
                <form onSubmit={handleSubmit} className="login-form">
                    {phase === 'email' ? (
                        <div className="login-field">
                            <label htmlFor="admin-email" className="label login-label">{t('admin.auth.email')}</label>
                            <input
                                id="admin-email"
                                name="email"
                                type="email"
                                placeholder={t('admin.auth.emailPlaceholder')}
                                value={email}
                                onChange={event => setEmail(event.target.value)}
                                className="input login-input"
                                autoComplete="email"
                                inputMode="email"
                                spellCheck={false}
                                required
                            />
                        </div>
                    ) : (
                        <div className="login-field">
                            <p className="login-email-context" role="status" aria-live="polite" aria-atomic="true">
                                {t('admin.auth.sentTo')} <strong>{requestedEmail}</strong>
                            </p>
                            <label htmlFor="admin-code" className="label login-label">{t('admin.auth.code')}</label>
                            <input
                                id="admin-code"
                                name="otp"
                                type="text"
                                value={code}
                                onChange={event => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
                                className="input login-input login-code-input"
                                autoComplete="one-time-code"
                                inputMode="numeric"
                                spellCheck={false}
                                pattern="[0-9]{6}"
                                minLength={6}
                                maxLength={6}
                                required
                            />
                        </div>
                    )}
                    {errorMessage && (
                        <div className="login-error" role="alert">
                            <p className="login-error-text">{errorMessage}</p>
                        </div>
                    )}
                    <button
                        type="submit"
                        className="btn btn--primary w-full login-submit"
                        disabled={submitting}
                    >
                        {submitting
                            ? t('admin.auth.processing')
                            : phase === 'email'
                                ? t('admin.auth.sendCode')
                                : t('admin.auth.verifyCode')}
                    </button>
                    {phase === 'code' && (
                        <div className="login-secondary-actions">
                            <button type="button" className="login-link" onClick={handleResend}
                                    disabled={submitting || resendSeconds > 0}>
                                {resendSeconds > 0
                                    ? `${t('admin.auth.resendIn')} ${resendSeconds}s`
                                    : t('admin.auth.resend')}
                            </button>
                            <button type="button" className="login-link" onClick={handleChangeEmail}
                                    disabled={submitting}>
                                {t('admin.auth.changeEmail')}
                            </button>
                        </div>
                    )}
                </form>
                <p className="login-privacy">{t('admin.auth.privacy')}</p>
            </div>
        </div>
    );
}

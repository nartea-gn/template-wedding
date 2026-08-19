import {type FormEvent, type ReactNode, useEffect, useRef, useState} from 'react'
import './LoginForm.css'
import {useLocalization} from '../../app/providers/useLocalization'
import type {WeddingMessageKey} from '../../invitations/wedding'
import {InterfaceIcon} from '../ui/InterfaceIcon'
import type {AdminAuthError, AdminAuthPhase} from '../../hooks/useAdminSession'

type SharedLoginFormProps = {
    title: string
    error: AdminAuthError
    submitting: boolean
}

type OtpLoginFormProps = SharedLoginFormProps & {
    method: 'otp'
    phase: Extract<AdminAuthPhase, 'email' | 'code'>
    requestedEmail: string
    onRequestCode: (email: string) => Promise<boolean>
    onVerifyCode: (code: string) => Promise<boolean>
    onChangeEmail: () => void
}

type PasswordLoginFormProps = SharedLoginFormProps & {
    method: 'password'
    onAuthenticate: (email: string, password: string) => Promise<boolean>
}

type LoginFormProps = OtpLoginFormProps | PasswordLoginFormProps

type LoginFrameProps = {
    title: string
    description: string
    children: ReactNode
}

const RESEND_DELAY_SECONDS = 60

function LoginFrame({title, description, children}: LoginFrameProps) {
    const {t} = useLocalization<WeddingMessageKey>()

    return (
        <div className="login-page">
            <div className="card login-card">
                <div className="login-heading">
                    <InterfaceIcon name="lock" className="login-icon"/>
                    <h1 className="login-title">{title}</h1>
                    <p className="login-description">{description}</p>
                </div>
                {children}
                <p className="login-privacy">{t('admin.auth.privacy')}</p>
            </div>
        </div>
    )
}

function OtpLoginForm({
                          title,
                          phase,
                          requestedEmail,
                          error,
                          submitting,
                          onRequestCode,
                          onVerifyCode,
                          onChangeEmail,
                      }: OtpLoginFormProps) {
    const {t} = useLocalization<WeddingMessageKey>()
    const [email, setEmail] = useState('')
    const [code, setCode] = useState('')
    const [resendSeconds, setResendSeconds] = useState(RESEND_DELAY_SECONDS)
    const codeRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        if (phase === 'code') {
            codeRef.current?.focus()
        }
    }, [phase])

    useEffect(() => {
        if (phase !== 'code' || resendSeconds <= 0) return
        const timer = window.setTimeout(() => setResendSeconds(value => value - 1), 1000)
        return () => window.clearTimeout(timer)
    }, [phase, resendSeconds])

    const handleSubmit = async (event: FormEvent) => {
        event.preventDefault()
        if (phase === 'email') {
            const sent = await onRequestCode(email)
            if (sent) {
                setCode('')
                setResendSeconds(RESEND_DELAY_SECONDS)
            }
            return
        }
        await onVerifyCode(code)
    }

    const handleResend = async () => {
        if (resendSeconds > 0) return
        const sent = await onRequestCode(requestedEmail)
        if (sent) setResendSeconds(RESEND_DELAY_SECONDS)
    }

    const handleChangeEmail = () => {
        setCode('')
        onChangeEmail()
    }

    const errorMessage = error === 'request'
        ? t('admin.auth.requestError')
        : error === 'verification'
            ? t('admin.auth.codeInvalid')
            : error === 'verificationRequest'
                ? t('admin.auth.verificationError')
                : error === 'session'
                    ? t('admin.auth.sessionError')
                    : null

    return (
        <LoginFrame
            title={title}
            description={phase === 'email' ? t('admin.auth.emailDescription') : t('admin.auth.codeDescription')}
        >
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
                            aria-invalid={Boolean(errorMessage)}
                            aria-describedby={errorMessage ? 'admin-auth-error' : undefined}
                            required
                            autoFocus
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
                            aria-invalid={Boolean(errorMessage)}
                            aria-describedby={errorMessage ? 'admin-auth-error' : undefined}
                            required
                            ref={codeRef}
                        />
                    </div>
                )}
                {errorMessage && (
                    <div id="admin-auth-error" className="login-error" role="alert">
                        <p className="login-error-text">{errorMessage}</p>
                    </div>
                )}
                <button type="submit" className="btn btn--primary w-full login-submit" disabled={submitting}>
                    {submitting
                        ? t('admin.auth.processing')
                        : phase === 'email'
                            ? t('admin.auth.sendCode')
                            : t('admin.auth.verifyCode')}
                </button>
                {phase === 'code' && (
                    <div className="login-secondary-actions">
                        <button
                            type="button"
                            className="login-link"
                            onClick={handleResend}
                            disabled={submitting || resendSeconds > 0}
                        >
                            {resendSeconds > 0
                                ? `${t('admin.auth.resendIn')} ${resendSeconds}s`
                                : t('admin.auth.resend')}
                        </button>
                        <button
                            type="button"
                            className="login-link"
                            onClick={handleChangeEmail}
                            disabled={submitting}
                        >
                            {t('admin.auth.changeEmail')}
                        </button>
                    </div>
                )}
            </form>
        </LoginFrame>
    )
}

function PasswordLoginForm({title, error, submitting, onAuthenticate}: PasswordLoginFormProps) {
    const {t} = useLocalization<WeddingMessageKey>()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [passwordVisible, setPasswordVisible] = useState(false)
    const emailRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        emailRef.current?.focus()
    }, [])

    const handleSubmit = async (event: FormEvent) => {
        event.preventDefault()
        await onAuthenticate(email, password)
    }

    const errorMessage = error === 'credentials'
        ? t('admin.auth.credentialsInvalid')
        : error === 'authenticationRequest'
            ? t('admin.auth.authenticationError')
            : error === 'session'
                ? t('admin.auth.sessionError')
                : null
    const passwordVisibilityLabel = passwordVisible
        ? t('admin.auth.hidePassword')
        : t('admin.auth.showPassword')

    return (
        <LoginFrame title={title} description={t('admin.auth.passwordDescription')}>
            <form onSubmit={handleSubmit} className="login-form">
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
                        aria-invalid={Boolean(errorMessage)}
                        aria-describedby={errorMessage ? 'admin-auth-error' : undefined}
                        required
                        ref={emailRef}
                    />
                </div>
                <div className="login-field">
                    <label htmlFor="admin-password" className="label login-label">{t('admin.auth.password')}</label>
                    <div className="login-password-control">
                        <input
                            id="admin-password"
                            name="password"
                            type={passwordVisible ? 'text' : 'password'}
                            value={password}
                            onChange={event => setPassword(event.target.value)}
                            className="input login-input login-password-input"
                            autoComplete="current-password"
                            autoCapitalize="none"
                            spellCheck={false}
                            aria-invalid={Boolean(errorMessage)}
                            aria-describedby={errorMessage ? 'admin-auth-error' : undefined}
                            required
                        />
                        <button
                            type="button"
                            className="login-password-toggle"
                            onClick={() => setPasswordVisible(value => !value)}
                            aria-label={passwordVisibilityLabel}
                            aria-pressed={passwordVisible}
                            aria-controls="admin-password"
                            title={passwordVisibilityLabel}
                        >
                            <InterfaceIcon
                                name={passwordVisible ? 'eye-off' : 'eye'}
                                className="login-password-toggle-icon"
                            />
                        </button>
                    </div>
                </div>
                {errorMessage && (
                    <div id="admin-auth-error" className="login-error" role="alert">
                        <p className="login-error-text">{errorMessage}</p>
                    </div>
                )}
                <button type="submit" className="btn btn--primary w-full login-submit" disabled={submitting}>
                    {submitting ? t('admin.auth.processing') : t('admin.auth.signIn')}
                </button>
            </form>
        </LoginFrame>
    )
}

export function LoginForm(props: LoginFormProps) {
    if (props.method === 'password') return <PasswordLoginForm {...props}/>
    return <OtpLoginForm {...props}/>
}

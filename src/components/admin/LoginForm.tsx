import {type FormEvent, useState} from 'react';
import './LoginForm.css';
import {useLocalization} from '../../app/providers/useLocalization';
import type {WeddingMessageKey} from '../../invitations/wedding';
import {InterfaceIcon} from '../ui/InterfaceIcon';

type LoginFormProps = {
    title: string;
    errorMessage: string | null;
    onSubmit: (password: string) => void;
};

export function LoginForm({title, errorMessage, onSubmit}: LoginFormProps) {
    const {t} = useLocalization<WeddingMessageKey>();
    const [password, setPassword] = useState('');

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        onSubmit(password);
    };

    return (
        <div className="login-page">
            <div className="card login-card">
                <div>
                    <InterfaceIcon name="lock" className="login-icon"/>
                    <h2 className="login-title">
                        {title}
                    </h2>
                </div>
                <form onSubmit={handleSubmit} className="login-form">
                    <div className="login-field">
                        <label htmlFor="admin-password" className="sr-only">{t('admin.password')}</label>
                        <input
                            id="admin-password"
                            type="password"
                            placeholder={t('admin.password')}
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            className="input login-input"
                            autoComplete="current-password"
                            autoFocus
                        />
                    </div>
                    {errorMessage && (
                        <div className="login-error" role="alert">
                            <p className="login-error-text">{errorMessage}</p>
                        </div>
                    )}
                    <button
                        type="submit"
                        className="btn btn--primary w-full login-submit"
                    >
                        {t('admin.access')}
                    </button>
                </form>
            </div>
        </div>
    );
}

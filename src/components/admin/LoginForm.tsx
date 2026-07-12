import {type FormEvent, useState} from 'react';
import './LoginForm.css';
import {useLocalization} from '../../app/providers/useLocalization';
import type {WeddingMessageKey} from '../../invitations/wedding';

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
                    <span className="login-icon">🔐</span>
                    <h2 className="login-title">
                        {title}
                    </h2>
                </div>
                <form onSubmit={handleSubmit} className="login-form">
                    <div className="login-field">
                        <input
                            type="password"
                            placeholder={t('admin.password')}
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            className="input login-input"
                            autoFocus
                        />
                    </div>
                    {errorMessage && (
                        <div className="login-error">
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

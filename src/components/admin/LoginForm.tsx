import {type FormEvent, useState} from 'react';

type LoginFormProps = {
    title: string;
    errorMessage: string | null;
    onSubmit: (password: string) => void;
};

export function LoginForm({title, errorMessage, onSubmit}: LoginFormProps) {
    const [password, setPassword] = useState('');

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        onSubmit(password);
    };

    return (
        <div className="min-h-screen bg-wedding-bg flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-sm bg-white rounded-2xl border p-8 text-center space-y-6">
                <h2 className="font-serif text-2xl font-light">{title}</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input type="password" placeholder="Contraseña" value={password}
                           onChange={e => setPassword(e.target.value)}
                           className="w-full border-b py-2 text-center outline-none focus:border-wedding-primary text-sm tracking-widest"/>
                    {errorMessage && <p className="text-xs text-red-500">{errorMessage}</p>}
                    <button type="submit"
                            className="w-full px-6 py-2.5 bg-wedding-primary text-wedding-bg text-xs uppercase tracking-widest rounded-full font-semibold">Acceder
                    </button>
                </form>
            </div>
        </div>
    );
}

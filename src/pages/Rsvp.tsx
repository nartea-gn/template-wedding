import React, {useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {useRsvp} from '../hooks/useRsvp';
import type {RsvpFormData, RsvpInsert} from '../types/rsvp';
import './Rsvp.css';

const DIETARY_OPTIONS = [
    "Ninguna, como de todo",
    "Celíaco / intolerante al gluten",
    "Vegetariano / vegano",
    "Intolerante a la lactosa",
    "Alergia a frutos secos o marisco"
];

export default function Rsvp() {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const {submitRsvp, isLoading, isSuccess, isError, error, reset} = useRsvp();

    const [formData, setFormData] = useState<RsvpFormData>({
        fullName: '',
        attending: null,
        dietaryOptions: [],
        dietaryOther: '',
        busOption: '',
        songRequest: '',
        message: ''
    });

    const [errors, setErrors] = useState<{ [key: string]: boolean }>({});

    const handleCheckboxChange = (option: string) => {
        setFormData(prev => {
            const isSelected = prev.dietaryOptions.includes(option);
            const updated = isSelected
                ? prev.dietaryOptions.filter(item => item !== option)
                : [...prev.dietaryOptions, option];
            return {...prev, dietaryOptions: updated};
        });
    };

    const validateStep1 = () => {
        const newErrors = {
            fullName: !formData.fullName.trim(),
            attending: formData.attending === null
        };
        setErrors(newErrors);
        return !newErrors.fullName && !newErrors.attending;
    };

    const handleNextStep1 = async () => {
        if (validateStep1()) {
            if (formData.attending === false) {
                await handleSubmitNoAssistance();
            } else {
                nextStep();
            }
        }
    };

    const nextStep = () => setStep(prev => prev + 1);
    const prevStep = () => setStep(prev => prev - 1);

    const handleSubmitNoAssistance = async () => {
        const insert: RsvpInsert = {
            fullName: formData.fullName,
            attending: false,
            dietaryOptions: [],
            dietaryOther: '',
            busOption: '',
            songRequest: '',
            message: ''
        };
        await submitRsvp(insert);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateStep1()) return;

        const insert: RsvpInsert = {...formData, attending: formData.attending ?? false};
        await submitRsvp(insert);
    };

        if (isSuccess) {
        return (
            <div className="rsvp-success-page">
                <div className="card rsvp-success-card">
                    <span className="rsvp-success-icon">✨</span>
                    <h2 className="rsvp-success-title">
                        ¡Muchas gracias!
                    </h2>
                    <p className="rsvp-success-text">
                        {formData.attending
                            ? "Tu asistencia ha sido confirmada. ¡Nos vemos pronto!"
                            : "Lamentamos que no puedas asistir. Te echaremos de menos."}
                    </p>
                    <button
                        onClick={() => {
                            reset();
                            navigate('/');
                        }}
                        className="btn btn--outline rsvp-success-btn"
                    >
                        Volver al inicio
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="rsvp-page">
            <div className="card rsvp-card">

                {/* Progress bar */}
                <div className="rsvp-progress">
                    <div
                        className="rsvp-progress-bar"
                        style={{'--progress': `${(step / 4) * 100}%`} as React.CSSProperties}
                    />
                </div>

                <form onSubmit={handleSubmit} className="rsvp-form">
                    {step === 1 && (
                        <div className="rsvp-step">
                            <div>
                                <h2 className="section-title rsvp-section-title">Asistencia</h2>
                                <p className="section-subtitle">Confírmanos tu presencia</p>
                            </div>

                            <div className="rsvp-field">
                                <label className="label">Nombre y Apellidos *</label>
                                <input
                                    type="text"
                                    value={formData.fullName}
                                    onChange={e => {
                                        setFormData({...formData, fullName: e.target.value});
                                        if (errors.fullName) setErrors({...errors, fullName: false});
                                    }}
                                    className={`input ${errors.fullName ? 'rsvp-input--error' : ''}`}
                                    placeholder="Tu nombre completo"
                                />
                                {errors.fullName && (
                                    <p className="rsvp-error-text">
                                        Este campo es obligatorio
                                    </p>
                                )}
                            </div>

                            <div className="rsvp-field">
                                <label className="label">¿Podrás asistir? *</label>
                                <div className="rsvp-option-grid">
                                    {[
                                        {value: true, label: 'Sí, ¡allí estaré!', emoji: '💍'},
                                        {value: false, label: 'No podré asistir', emoji: '💔'},
                                    ].map(option => (
                                        <label
                                            key={String(option.value)}
                                            className={`rsvp-option ${
                                                formData.attending === option.value
                                                    ? 'rsvp-option--selected'
                                                    : errors.attending
                                                        ? 'rsvp-option--error'
                                                        : ''
                                            }`}
                                        >
                                            <input
                                                type="radio"
                                                checked={formData.attending === option.value}
                                                onChange={() => {
                                                    setFormData({...formData, attending: option.value});
                                                    setErrors({...errors, attending: false});
                                                }}
                                                className="rsvp-radio"
                                            />
                                            <span className="rsvp-option-label">{option.emoji} {option.label}</span>
                                        </label>
                                    ))}
                                </div>
                                {errors.attending && (
                                    <p className="rsvp-error-text">
                                        Por favor, selecciona una opción
                                    </p>
                                )}
                            </div>

                            <div className="rsvp-actions-end">
                                <button
                                    type="button"
                                    onClick={handleNextStep1}
                                    className="btn btn--primary"
                                >
                                    {formData.attending === false ? "Enviar Respuesta" : "Siguiente"}
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="rsvp-step">
                            <div>
                                <h2 className="section-title rsvp-section-title">Banquete y Logística</h2>
                                <p className="section-subtitle">Ayúdanos a organizarlo todo</p>
                            </div>

                            <div className="rsvp-field">
                                <label className="label">Restricciones alimentarias</label>
                                <div className="rsvp-dietary-list">
                                    {DIETARY_OPTIONS.map(option => (
                                        <label
                                            key={option}
                                            className="rsvp-checkbox-option"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={formData.dietaryOptions.includes(option)}
                                                onChange={() => handleCheckboxChange(option)}
                                                className="rsvp-checkbox"
                                            />
                                            <span className="text-sm">{option}</span>
                                        </label>
                                    ))}
                                </div>
                                <input
                                    type="text"
                                    placeholder="Otros detalles..."
                                    value={formData.dietaryOther}
                                    onChange={e => setFormData({...formData, dietaryOther: e.target.value})}
                                    className="input rsvp-input-other"
                                />
                            </div>

                            <div className="rsvp-field">
                                <label className="label">Plaza en autobús</label>
                                <select
                                    value={formData.busOption}
                                    onChange={e => setFormData({...formData, busOption: e.target.value})}
                                    className="input rsvp-select"
                                >
                                    <option value="">Selecciona una opción...</option>
                                    <option value="ida_vuelta">Sí, para la ida y la vuelta</option>
                                    <option value="solo_ida">Sólo para la ida</option>
                                    <option value="solo_vuelta">Sólo para la vuelta</option>
                                    <option value="no">No, iré en mi propio transporte</option>
                                </select>
                            </div>

                            <div className="rsvp-actions-between">
                                <button
                                    type="button"
                                    onClick={prevStep}
                                    className="btn btn--ghost rsvp-btn-ghost"
                                >
                                    Atrás
                                </button>
                                <button
                                    type="button"
                                    onClick={nextStep}
                                    className="btn btn--primary"
                                >
                                    Siguiente
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="rsvp-step">
                            <div>
                                <h2 className="section-title rsvp-section-title">Luna de Miel & Ritmo</h2>
                                <p className="section-subtitle">Ayúdanos a crear la banda sonora</p>
                            </div>

                            <div className="rsvp-info-box">
                                Vuestra presencia es nuestro mejor regalo. Pero si deseas contribuir a nuestra nueva
                                aventura, habilitaremos los detalles correspondientes. ¡Gracias!
                            </div>

                            <div className="rsvp-field">
                                <label className="label">Canción para la pista</label>
                                <input
                                    type="text"
                                    placeholder="Título y artista"
                                    value={formData.songRequest}
                                    onChange={e => setFormData({...formData, songRequest: e.target.value})}
                                    className="rsvp-input"
                                />
                            </div>

                            <div className="rsvp-actions-between">
                                <button
                                    type="button"
                                    onClick={prevStep}
                                    className="btn btn--ghost rsvp-btn-ghost"
                                >
                                    Atrás
                                </button>
                                <button
                                    type="button"
                                    onClick={nextStep}
                                    className="btn btn--primary"
                                >
                                    Siguiente
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 4 && (
                        <div className="rsvp-step">
                            <div>
                                <h2 className="section-title rsvp-section-title">Dedicatoria</h2>
                                <p className="section-subtitle">Déjanos un mensaje especial</p>
                            </div>

                            <div className="rsvp-field">
                                <label className="label">Tu mensaje</label>
                                <textarea
                                    rows={4}
                                    placeholder="Escribe aquí tu mensaje..."
                                    value={formData.message}
                                    onChange={e => setFormData({...formData, message: e.target.value})}
                                    className="input rsvp-textarea"
                                />
                            </div>

                            <div className="rsvp-actions-between">
                                <button
                                    type="button"
                                    onClick={prevStep}
                                    className="btn btn--ghost rsvp-btn-ghost"
                                >
                                    Atrás
                                </button>
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="btn btn--primary rsvp-btn-submit"
                                >
                                    {isLoading ? "Enviando..." : "Confirmar todo"}
                                </button>
                            </div>
                        </div>
                    )}

                    {isError && (
                        <div className="rsvp-error-box">
                            <p className="rsvp-error-box-text" role="alert">
                                Hubo un error al guardar tu asistencia. Inténtalo de nuevo.
                            </p>
                            {error?.message && (
                                <span className="rsvp-error-box-detail">
                                    {error.message}
                                </span>
                            )}
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
}

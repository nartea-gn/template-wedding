import React, {useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {useRsvp} from '../hooks/useRsvp';
import type {RsvpFormData, RsvpInsert} from '../types/rsvp';
import {useLocalization} from '../app/providers/useLocalization';
import type {WeddingMessageKey} from '../invitations/wedding';
import './Rsvp.css';

const DIETARY_OPTIONS = [
    {value: 'none', label: 'rsvp.dietary.none'},
    {value: 'gluten', label: 'rsvp.dietary.gluten'},
    {value: 'vegetarian', label: 'rsvp.dietary.vegetarian'},
    {value: 'lactose', label: 'rsvp.dietary.lactose'},
    {value: 'nuts_seafood', label: 'rsvp.dietary.nutsSeafood'},
] as const satisfies ReadonlyArray<{value: string; label: WeddingMessageKey}>;

export default function Rsvp() {
    const navigate = useNavigate();
    const {t} = useLocalization<WeddingMessageKey>();
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
                        {t('rsvp.success.title')}
                    </h2>
                    <p className="rsvp-success-text">
                        {formData.attending
                            ? t('rsvp.success.attending')
                            : t('rsvp.success.declined')}
                    </p>
                    <button
                        onClick={() => {
                            reset();
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
                                <h2 className="section-title rsvp-section-title">{t('rsvp.step.attendance.title')}</h2>
                                <p className="section-subtitle">{t('rsvp.step.attendance.subtitle')}</p>
                            </div>

                            <div className="rsvp-field">
                                <label className="label">{t('rsvp.fullName.label')}</label>
                                <input
                                    type="text"
                                    value={formData.fullName}
                                    onChange={e => {
                                        setFormData({...formData, fullName: e.target.value});
                                        if (errors.fullName) setErrors({...errors, fullName: false});
                                    }}
                                    className={`input ${errors.fullName ? 'rsvp-input--error' : ''}`}
                                    placeholder={t('rsvp.fullName.placeholder')}
                                />
                                {errors.fullName && (
                                    <p className="rsvp-error-text">
                                        {t('rsvp.required')}
                                    </p>
                                )}
                            </div>

                            <div className="rsvp-field">
                                <label className="label">{t('rsvp.attending.label')}</label>
                                <div className="rsvp-option-grid">
                                    {[
                                        {value: true, label: t('rsvp.attending.yes'), emoji: '💍'},
                                        {value: false, label: t('rsvp.attending.no'), emoji: '💔'},
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
                                        {t('rsvp.attending.required')}
                                    </p>
                                )}
                            </div>

                            <div className="rsvp-actions-end">
                                <button
                                    type="button"
                                    onClick={handleNextStep1}
                                    className="btn btn--primary"
                                >
                                    {formData.attending === false ? t('rsvp.send') : t('rsvp.next')}
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="rsvp-step">
                            <div>
                                <h2 className="section-title rsvp-section-title">{t('rsvp.step.meal.title')}</h2>
                                <p className="section-subtitle">{t('rsvp.step.meal.subtitle')}</p>
                            </div>

                            <div className="rsvp-field">
                                <label className="label">{t('rsvp.dietary.label')}</label>
                                <div className="rsvp-dietary-list">
                                    {DIETARY_OPTIONS.map(option => (
                                        <label
                                            key={option.value}
                                            className="rsvp-checkbox-option"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={formData.dietaryOptions.includes(option.value)}
                                                onChange={() => handleCheckboxChange(option.value)}
                                                className="rsvp-checkbox"
                                            />
                                            <span className="text-sm">{t(option.label)}</span>
                                        </label>
                                    ))}
                                </div>
                                <input
                                    type="text"
                                    placeholder={t('rsvp.dietary.other')}
                                    value={formData.dietaryOther}
                                    onChange={e => setFormData({...formData, dietaryOther: e.target.value})}
                                    className="input rsvp-input-other"
                                />
                            </div>

                            <div className="rsvp-field">
                                <label className="label">{t('rsvp.bus.label')}</label>
                                <select
                                    value={formData.busOption}
                                    onChange={e => setFormData({...formData, busOption: e.target.value})}
                                    className="input rsvp-select"
                                >
                                    <option value="">{t('rsvp.bus.placeholder')}</option>
                                    <option value="ida_vuelta">{t('rsvp.bus.roundTrip')}</option>
                                    <option value="solo_ida">{t('rsvp.bus.outbound')}</option>
                                    <option value="solo_vuelta">{t('rsvp.bus.return')}</option>
                                    <option value="no">{t('rsvp.bus.no')}</option>
                                </select>
                            </div>

                            <div className="rsvp-actions-between">
                                <button
                                    type="button"
                                    onClick={prevStep}
                                    className="btn btn--ghost rsvp-btn-ghost"
                                >
                                    {t('rsvp.back')}
                                </button>
                                <button
                                    type="button"
                                    onClick={nextStep}
                                    className="btn btn--primary"
                                >
                                    {t('rsvp.next')}
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="rsvp-step">
                            <div>
                                <h2 className="section-title rsvp-section-title">{t('rsvp.step.music.title')}</h2>
                                <p className="section-subtitle">{t('rsvp.step.music.subtitle')}</p>
                            </div>

                            <div className="rsvp-info-box">
                                {t('rsvp.gift.info')}
                            </div>

                            <div className="rsvp-field">
                                <label className="label">{t('rsvp.song.label')}</label>
                                <input
                                    type="text"
                                    placeholder={t('rsvp.song.placeholder')}
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
                                    {t('rsvp.back')}
                                </button>
                                <button
                                    type="button"
                                    onClick={nextStep}
                                    className="btn btn--primary"
                                >
                                    {t('rsvp.next')}
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 4 && (
                        <div className="rsvp-step">
                            <div>
                                <h2 className="section-title rsvp-section-title">{t('rsvp.step.message.title')}</h2>
                                <p className="section-subtitle">{t('rsvp.step.message.subtitle')}</p>
                            </div>

                            <div className="rsvp-field">
                                <label className="label">{t('rsvp.message.label')}</label>
                                <textarea
                                    rows={4}
                                    placeholder={t('rsvp.message.placeholder')}
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
                                    {t('rsvp.back')}
                                </button>
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="btn btn--primary rsvp-btn-submit"
                                >
                                    {isLoading ? t('rsvp.submitting') : t('rsvp.submit')}
                                </button>
                            </div>
                        </div>
                    )}

                    {isError && (
                        <div className="rsvp-error-box">
                            <p className="rsvp-error-box-text" role="alert">
                                {t('rsvp.error.submit')}
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

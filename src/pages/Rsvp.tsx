import React, {useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {useRsvp} from '../hooks/useRsvp';
import type {RsvpFormData, RsvpInsert} from '../types/rsvp';

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
            <div
                className="min-h-screen bg-wedding-bg text-wedding-dark flex flex-col items-center justify-center p-6 text-center font-sans">
                <div className="max-w-md bg-white p-8 rounded-2xl shadow-sm border border-wedding-primary/10 space-y-4">
                    <span className="text-4xl">✨</span>
                    <h2 className="font-serif text-3xl font-light">¡Muchas gracias!</h2>
                    <p className="text-wedding-primary/80 text-sm">
                        {formData.attending ? "Tu asistencia ha sido confirmada." : "Lamentamos que no puedas asistir."}
                    </p>
                    <button onClick={() => {
                        reset();
                        navigate('/');
                    }}
                            className="mt-4 px-6 py-2 border border-wedding-primary text-wedding-primary rounded-full text-xs uppercase tracking-wider hover:bg-wedding-primary hover:text-wedding-bg transition-colors">
                        Volver al inicio
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-wedding-bg text-wedding-dark flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-xl bg-white rounded-2xl shadow-sm border p-6 md:p-10">

                <div className="w-full bg-wedding-bg h-1 rounded-full mb-8 overflow-hidden">
                    <div className="bg-wedding-primary h-full transition-all duration-300"
                         style={{width: `${(step / 4) * 100}%`}}/>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {step === 1 && (
                        <div className="space-y-6 animate-fade-in">
                            <h2 className="font-serif text-2xl font-light">Asistencia</h2>

                            <div className="space-y-2">
                                <label className="text-xs uppercase tracking-wider font-semibold flex justify-between">
                                    <span>Nombre y Apellidos *</span>
                                    {errors.fullName &&
                                        <span className="text-red-500 text-[10px] lowercase italic">Este campo es obligatorio</span>}
                                </label>
                                <input
                                    type="text"
                                    value={formData.fullName}
                                    onChange={e => {
                                        setFormData({...formData, fullName: e.target.value});
                                        if (errors.fullName) setErrors({...errors, fullName: false});
                                    }}
                                    className={`w-full border-b py-2 outline-none transition-colors ${errors.fullName ? 'border-red-500 focus:border-red-500' : 'focus:border-wedding-primary'}`}
                                />
                            </div>

                            <div className="space-y-3">
                                <label className="text-xs uppercase tracking-wider font-semibold flex justify-between">
                                    <span>¿Podrás asistir? *</span>
                                    {errors.attending &&
                                        <span className="text-red-500 text-[10px] lowercase italic">Por favor, selecciona una opción</span>}
                                </label>
                                <label
                                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${errors.attending ? 'border-red-300 bg-red-50/30' : ''}`}>
                                    <input type="radio" checked={formData.attending === true}
                                           onChange={() => {
                                               setFormData({...formData, attending: true});
                                               setErrors({...errors, attending: false});
                                           }}
                                           className="accent-wedding-primary"/>
                                    <span className="text-sm">Sí, ¡allí estaré!</span>
                                </label>
                                <label
                                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${errors.attending ? 'border-red-300 bg-red-50/30' : ''}`}>
                                    <input type="radio" checked={formData.attending === false}
                                           onChange={() => {
                                               setFormData({...formData, attending: false});
                                               setErrors({...errors, attending: false});
                                           }}
                                           className="accent-wedding-primary"/>
                                    <span className="text-sm">No podré asistir</span>
                                </label>
                            </div>
                            <div className="flex justify-end">
                                <button type="button"
                                        onClick={handleNextStep1}
                                        className="px-6 py-2.5 bg-wedding-primary text-wedding-bg text-xs uppercase tracking-wider rounded-full transition-opacity active:scale-95">
                                    {formData.attending === false ? "Enviar Respuesta" : "Siguiente"}
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-6 animate-fade-in">
                            <h2 className="font-serif text-2xl font-light">Banquete y Logística</h2>
                            <div className="space-y-2">
                                <label className="text-xs uppercase tracking-wider font-semibold block">Restricciones
                                    alimentarias</label>
                                {DIETARY_OPTIONS.map(option => (
                                    <label key={option} className="flex items-center gap-3 text-sm">
                                        <input type="checkbox" checked={formData.dietaryOptions.includes(option)}
                                               onChange={() => handleCheckboxChange(option)}
                                               className="accent-wedding-primary"/>
                                        <span>{option}</span>
                                    </label>
                                ))}
                                <input type="text" placeholder="Otros detalles..." value={formData.dietaryOther}
                                       onChange={e => setFormData({...formData, dietaryOther: e.target.value})}
                                       className="w-full border-b py-2 text-sm outline-none focus:border-wedding-primary"/>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs uppercase tracking-wider font-semibold block">Plaza en
                                    autobús</label>
                                <select value={formData.busOption}
                                        onChange={e => setFormData({...formData, busOption: e.target.value})}
                                        className="w-full bg-transparent border-b py-2 text-sm outline-none focus:border-wedding-primary">
                                    <option value="">Selecciona una opción...</option>
                                    <option value="ida_vuelta">Sí, para la ida y la vuelta</option>
                                    <option value="solo_ida">Sólo para la ida</option>
                                    <option value="solo_vuelta">Sólo para la vuelta</option>
                                    <option value="no">No, iré en mi propio transporte</option>
                                </select>
                            </div>
                            <div className="flex justify-between">
                                <button type="button" onClick={prevStep}
                                        className="text-xs uppercase tracking-wider text-wedding-primary/70">Atrás
                                </button>
                                <button type="button" onClick={nextStep}
                                        className="px-6 py-2.5 bg-wedding-primary text-wedding-bg text-xs uppercase tracking-wider rounded-full">Siguiente
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-6 animate-fade-in">
                            <h2 className="font-serif text-2xl font-light">Luna de Miel & Ritmo</h2>
                            <div className="p-4 bg-wedding-bg/60 border rounded-xl text-xs leading-relaxed">
                                Vuestra presencia es nuestro mejor regalo. Pero si deseas contribuir a nuestra nueva
                                aventura, habilitaremos los detalles correspondientes. ¡Gracias!
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs uppercase tracking-wider font-semibold block">Canción para la
                                    pista</label>
                                <input type="text" placeholder="Título y artista" value={formData.songRequest}
                                       onChange={e => setFormData({...formData, songRequest: e.target.value})}
                                       className="w-full border-b py-2 text-sm outline-none focus:border-wedding-primary"/>
                            </div>
                            <div className="flex justify-between">
                                <button type="button" onClick={prevStep}
                                        className="text-xs uppercase tracking-wider text-wedding-primary/70">Atrás
                                </button>
                                <button type="button" onClick={nextStep}
                                        className="px-6 py-2.5 bg-wedding-primary text-wedding-bg text-xs uppercase tracking-wider rounded-full">Siguiente
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 4 && (
                        <div className="space-y-6 animate-fade-in">
                            <h2 className="font-serif text-2xl font-light">Dedicatoria</h2>
                            <textarea rows={4} placeholder="Escribe aquí tu mensaje..." value={formData.message}
                                      onChange={e => setFormData({...formData, message: e.target.value})}
                                      className="w-full border rounded-xl p-3 text-sm outline-none focus:border-wedding-primary resize-none"/>
                            <div className="flex justify-between">
                                <button type="button" onClick={prevStep}
                                        className="text-xs uppercase tracking-wider text-wedding-primary/70">Atrás
                                </button>
                                <button type="submit" disabled={isLoading}
                                        className="px-8 py-2.5 bg-wedding-primary text-wedding-bg text-xs uppercase tracking-wider rounded-full disabled:opacity-50">
                                    {isLoading ? "Enviando..." : "Confirmar todo"}
                                </button>
                            </div>
                        </div>
                    )}

                    {isError && (
                        <p className="text-red-500 text-sm text-center" role="alert">
                            Hubo un error al guardar tu asistencia. Inténtalo de nuevo.
                            {error?.message && <span className="block text-xs mt-1 opacity-80">{error.message}</span>}
                        </p>
                    )}
                </form>
            </div>
        </div>
    );
}

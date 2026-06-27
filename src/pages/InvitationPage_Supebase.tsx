import { useNavigate } from 'react-router-dom';
import { weddingConfig } from '../config/wedding.config';

export default function InvitationPage() {
    const navigate = useNavigate();
    const { couple, event, invitation } = weddingConfig;

    const eventDate = new Date(event.date);
    const options: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const formattedDate = eventDate.toLocaleDateString('es-ES', options);

    return (
        <div className="min-h-screen bg-wedding-bg text-wedding-dark flex flex-col items-center justify-between p-6 md:p-12 font-sans selection:bg-wedding-primary/20">

            <header className="text-center mt-8 max-w-2xl animate-fade-in">
        <span className="text-xs tracking-[0.2em] uppercase text-wedding-primary/70 block mb-3 font-semibold">
          {invitation.title}
        </span>
                <h1 className="font-serif text-5xl md:text-7xl font-light tracking-wide mb-4">
                    {couple.displayNames}
                </h1>
                <p className="italic text-wedding-primary font-serif text-lg md:text-xl">
                    {invitation.subtitle}
                </p>
            </header>

            <main className="w-full max-w-3xl my-8 aspect-video rounded-xl overflow-hidden shadow-sm border border-wedding-primary/10 bg-black/5">
                <video
                    src={`/media/${invitation.videoFileName}`}
                    controls
                    playsInline
                    className="w-full h-full object-cover"
                >
                    Tu navegador no soporta vídeos.
                </video>
            </main>

            <footer className="text-center mb-8 max-w-xl flex flex-col items-center gap-6">
                <div className="space-y-2">
                    <p className="text-sm tracking-wider uppercase font-semibold text-wedding-primary">
                        {formattedDate} — {event.time}h
                    </p>
                    <p className="font-serif text-xl font-light">
                        {event.venue}, <span className="italic">{event.city}</span>
                    </p>
                </div>

                <button
                    onClick={() => navigate('/rsvp')}
                    className="mt-4 px-8 py-3.5 bg-wedding-primary text-wedding-bg tracking-widest uppercase text-xs font-semibold rounded-full shadow-md hover:bg-wedding-dark transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                >
                    {invitation.rsvpButtonText}
                </button>
            </footer>

        </div>
    );
}
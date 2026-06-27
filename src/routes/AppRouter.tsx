import {HashRouter, Navigate, Route, Routes} from 'react-router-dom'; // 1. Cambiado a HashRouter
import InvitationPage from '../pages/InvitationPage';
import RsvpPage from '../pages/RsvpPage';
import AdminRsvpPage from '../pages/AdminRsvpPage';

export default function AppRouter() {
    return (
        // 2. Usamos HashRouter (no requiere basename)
        <HashRouter>
            <Routes>
                {/* Ruta principal pública */}
                <Route path="/" element={<InvitationPage/>}/>

                {/* Ruta del formulario público */}
                <Route path="/rsvp" element={<RsvpPage/>}/>

                {/* Ruta de administración */}
                <Route path="/admin/rsvp" element={<AdminRsvpPage/>}/>

                {/* Redirección por defecto si escriben cualquier otra ruta */}
                <Route path="*" element={<Navigate to="/" replace/>}/>
            </Routes>
        </HashRouter>
    );
}
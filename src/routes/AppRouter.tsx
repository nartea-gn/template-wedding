import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import InvitationPage from '../pages/InvitationPage';
import RsvpPage from '../pages/RsvpPage';
import AdminRsvpPage from '../pages/AdminRsvpPage';

export default function AppRouter() {
    return (
        <BrowserRouter>
            <Routes>
                {/* Ruta principal pública */}
                <Route path="/" element={<InvitationPage />} />

                {/* Ruta del formulario público */}
                <Route path="/rsvp" element={<RsvpPage />} />

                {/* Ruta del panel de control de los novios */}
                <Route path="/admin/rsvp" element={<AdminRsvpPage />} />

                {/* Redirección por defecto si escriben cualquier otra ruta */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    );
}
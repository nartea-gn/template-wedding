import {BrowserRouter, Navigate, Route, Routes} from 'react-router-dom';
import InvitationPage from '../pages/InvitationPage';
import RsvpPage from '../pages/RsvpPage';
import AdminRsvpPage from '../pages/AdminRsvpPage';

export default function AppRouter() {
    return (
        // 1. Añadimos el basename apuntando a tu repositorio
        <BrowserRouter basename="/template-wedding">
            <Routes>
                {/* Ruta principal pública */}
                <Route path="/" element={<InvitationPage/>}/>

                {/* Ruta del formulario público */}
                <Route path="rsvp" element={<RsvpPage/>}/>

                {/* 2. Quitamos la barra '/' inicial de las subrutas para que sean relativas al basename */}
                <Route path="admin/rsvp" element={<AdminRsvpPage/>}/>

                {/* Redirección por defecto si escriben cualquier otra ruta */}
                <Route path="*" element={<Navigate to="/" replace/>}/>
            </Routes>
        </BrowserRouter>
    );
}
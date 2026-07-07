import {HashRouter, Route, Routes} from 'react-router-dom';
import InvitationPage from '../pages/InvitationPage';
import RsvpPage from '../pages/RsvpPage';
import AdminRsvpPage from '../pages/AdminRsvpPage';

export default function AppRouter() {
    return (
        <HashRouter>
            <Routes>
                {/* Ruta principal pública */}
                <Route path="/" element={<InvitationPage/>}/>

                {/* Ruta del formulario público */}
                <Route path="/rsvp" element={<RsvpPage/>}/>

                {/* Ruta del panel de control de los novios */}
                <Route path="/admin" element={<AdminRsvpPage/>}/>

                {/* Cambiamos el redireccionamiento por un texto de prueba */}
                <Route path="*"
                       element={<div className="p-8 text-center text-red-500 font-mono">Ruta no encontrada dentro de
                           React Router</div>}/>
            </Routes>
        </HashRouter>
    );
}
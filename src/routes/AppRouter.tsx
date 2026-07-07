import {HashRouter, Route, Routes} from 'react-router-dom';
import Landing from '../pages/Landing.tsx';
import Rsvp from '../pages/Rsvp.tsx';
import Admin from '../pages/Admin.tsx';

export default function AppRouter() {
    return (
        <HashRouter>
            <Routes>
                {/* Ruta principal pública */}
                <Route path="/" element={<Landing/>}/>

                {/* Ruta del formulario público */}
                <Route path="/rsvp" element={<Rsvp/>}/>

                {/* Ruta del panel de control de los novios */}
                <Route path="/admin" element={<Admin/>}/>

                {/* Cambiamos el redireccionamiento por un texto de prueba */}
                <Route path="*"
                       element={<div className="p-8 text-center text-red-500 font-mono">Ruta no encontrada dentro de
                           React Router</div>}/>
            </Routes>
        </HashRouter>
    );
}
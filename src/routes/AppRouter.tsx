import {HashRouter, Route, Routes} from 'react-router-dom';
import Landing from '../pages/Landing.tsx';
import Rsvp from '../pages/Rsvp.tsx';
import Admin from '../pages/Admin.tsx';
import './AppRouter.css';
import {useLocalization} from '../app/providers/useLocalization';
import type {WeddingMessageKey} from '../invitations/wedding';

export default function AppRouter() {
    const {t} = useLocalization<WeddingMessageKey>();
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
                       element={<div className="route-not-found">{t('route.notFound')}</div>}/>
            </Routes>
        </HashRouter>
    );
}

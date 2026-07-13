import {lazy, Suspense} from 'react';
import {HashRouter, Route, Routes} from 'react-router-dom';
import {useLocalization} from '../app/providers/useLocalization';
import {weddingInvitation, type WeddingMessageKey} from '../invitations/wedding';
import Landing from '../pages/Landing.tsx';
import {RouteLoading} from '../components/RouteLoading';
import './AppRouter.css';

const Rsvp = lazy(() => import('../pages/Rsvp.tsx'));
const Admin = lazy(() => import('../pages/Admin.tsx'));

export default function AppRouter() {
    const {t} = useLocalization<WeddingMessageKey>();
    const rsvpEnabled = weddingInvitation.capabilities.rsvp?.enabled === true;
    const adminEnabled = rsvpEnabled && weddingInvitation.capabilities.admin?.enabled === true;
    return <HashRouter><Routes>
        <Route path="/" element={<Landing/>}/>
        {rsvpEnabled && <Route path="/rsvp" element={<Suspense fallback={<RouteLoading/>}><Rsvp/></Suspense>}/>}
        {adminEnabled && <Route path="/admin" element={<Suspense fallback={<RouteLoading/>}><Admin/></Suspense>}/>}
        <Route path="*" element={<div className="route-not-found">{t('route.notFound')}</div>}/>
    </Routes></HashRouter>;
}

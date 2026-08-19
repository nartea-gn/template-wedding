import {lazy, Suspense} from 'react';
import {HashRouter, Route, Routes} from 'react-router-dom';
import {useLocalization} from '../app/providers/useLocalization';
import {weddingInvitation, type WeddingMessageKey} from '../invitations/wedding';
import Landing from '../pages/Landing.tsx';
import {RouteLoading} from '../components/RouteLoading';
import {resolveRouteCapabilities} from './routeCapabilities';
import {useRsvpAvailability} from '../features/rsvp/hooks/useRsvpAvailability';
import './AppRouter.css';

const Rsvp = lazy(() => import('../pages/Rsvp.tsx'));
const Admin = lazy(() => import('../pages/Admin.tsx'));

export default function AppRouter() {
    const {t} = useLocalization<WeddingMessageKey>();
    const rsvpOpen = useRsvpAvailability(weddingInvitation.capabilities.rsvp);
    const routes = resolveRouteCapabilities(weddingInvitation.capabilities, rsvpOpen);
    return <HashRouter><main id="main-content"><Routes>
        <Route path="/" element={<Landing/>}/>
        {routes.rsvp && (
            <Route path="/rsvp" element={<Suspense fallback={<RouteLoading/>}><Rsvp/></Suspense>}/>
        )}
        {routes.admin && (
            <Route path="/admin" element={<Suspense fallback={<RouteLoading/>}><Admin/></Suspense>}/>
        )}
        <Route path="*" element={<div className="route-not-found">{t('route.notFound')}</div>}/>
    </Routes></main></HashRouter>;
}

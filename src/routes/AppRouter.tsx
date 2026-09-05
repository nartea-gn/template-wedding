import {lazy, Suspense} from 'react';
import {BrowserRouter, Route, Routes} from 'react-router-dom';
import {useLocalization} from '../app/providers/useLocalization';
import {weddingInvitation, type WeddingMessageKey} from '../invitations/wedding';
import Landing from '../pages/Landing.tsx';
import {RouteLoading} from '../components/RouteLoading';
import {resolveRouteCapabilities} from './routeCapabilities';
import {RsvpStatusProvider} from '../features/rsvp/hooks/RsvpStatusProvider';
import {weddingRsvpRepository} from '../invitations/wedding/rsvpRepository';
import './AppRouter.css';

const Rsvp = lazy(() => import('../pages/Rsvp.tsx'));
const Admin = lazy(() => import('../pages/Admin.tsx'));

/**
 * Declares the invitation's routes as real paths.
 *
 * Real paths need a host that answers an unmatched request with the application shell. Cloudflare
 * Pages does it on its own -- a project without a `404.html` serves `index.html` with a `200` --
 * and `vite dev` does the same, so no rewrite rule is configured. A `_redirects` rule would in
 * fact break it: `/*` to `/index.html` is rejected as a loop and ignored, and naming a route
 * explicitly turns the request into a `308` to `/`, landing a bookmarked `/rsvp` on the landing
 * page. Publishing a `404.html` would silently take the fallback away; `pnpm smoke:test` requests
 * `/rsvp` and `/admin` against the deployment, which is what turns that into a red pipeline.
 *
 * The fragment is left to the document, which is why the skip link in `App.tsx` works: under hash
 * routing `#main-content` was read as a route and resolved to the wildcard.
 */
export default function AppRouter() {
    const {t} = useLocalization<WeddingMessageKey>();
    const routes = resolveRouteCapabilities(weddingInvitation.capabilities);
    return <RsvpStatusProvider repository={weddingRsvpRepository} invitationId={weddingInvitation.id}>
        <BrowserRouter><main id="main-content" tabIndex={-1}><Routes>
            <Route path="/" element={<Landing/>}/>
            <Route path="/rsvp" element={<Suspense fallback={<RouteLoading/>}><Rsvp/></Suspense>}/>
            {routes.admin && (
                <Route path="/admin" element={<Suspense fallback={<RouteLoading/>}><Admin/></Suspense>}/>
            )}
            <Route path="*" element={<div className="route-not-found">{t('route.notFound')}</div>}/>
        </Routes></main></BrowserRouter>
    </RsvpStatusProvider>;
}

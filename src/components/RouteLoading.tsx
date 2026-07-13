import {useLocalization} from '../app/providers/useLocalization'
import type {WeddingMessageKey} from '../invitations/wedding'
import './RouteLoading.css'

export function RouteLoading() {
    const {t} = useLocalization<WeddingMessageKey>()
    return (
        <div className="route-loading" role="status" aria-live="polite" aria-atomic="true">
            <span className="route-loading-indicator" aria-hidden="true"/>
            <span className="route-loading-label">{t('route.loading')}</span>
        </div>
    )
}

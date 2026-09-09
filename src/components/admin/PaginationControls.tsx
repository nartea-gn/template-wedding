import {useEffect, useRef} from 'react';
import {useLocalization} from '../../app/providers/useLocalization';
import type {WeddingMessageKey} from '../../invitations/wedding';
import './PaginationControls.css';

type Props = {
    currentPage: number
    totalPages: number
    onPageChange: (page: number) => void
    /**
     * Elemento al que subir la vista al cambiar de pagina.
     *
     * Sin esto el cambio solo movia el estado: el scroll se quedaba donde estaba y a 390 px la
     * pareja aterrizaba 3.143 px -- 3,7 pantallas -- por debajo del inicio de la pagina que
     * acababa de pedir, leyendo los dos ultimos invitados de la pagina 2 bajo un titulo que
     * decia "Pagina 2 de 6". Seis vueltas de pagina costaban unos 19.000 px de scroll correctivo.
     */
    scrollTargetId?: string
};

export function PaginationControls({currentPage, totalPages, onPageChange, scrollTargetId}: Props) {
    const {t} = useLocalization<WeddingMessageKey>();
    const settledPage = useRef(currentPage);

    // La vista sube en un efecto, no en el manejador del click: hacerlo en linea alinea la
    // seccion contra el layout anterior -- medido, la primera fila acababa 142 px por encima del
    // borde superior -- mientras que aqui la lista nueva ya esta compuesta.
    //
    // `block: 'start'` sin `behavior: 'smooth'`: un salto instantaneo respeta a quien pidio
    // movimiento reducido sin necesitar una rama aparte. Y solo cuando la pagina cambia de
    // verdad, para no robar el scroll al montar ni al filtrar.
    useEffect(() => {
        if (settledPage.current === currentPage) return;
        settledPage.current = currentPage;
        if (scrollTargetId) document.getElementById(scrollTargetId)?.scrollIntoView({block: 'start'});
    }, [currentPage, scrollTargetId]);

    if (totalPages <= 1) return null;
    return <nav className="admin-pagination" aria-label={t('admin.pagination.label')}>
        <button type="button"
                className="btn btn--outline admin-pagination-button admin-pagination-button--previous"
                disabled={currentPage <= 1}
                onClick={() => onPageChange(currentPage - 1)}>{t('admin.pagination.previous')}</button>
        <span className="admin-pagination-status" aria-live="polite">
            {t('admin.pagination.page')} {currentPage} {t('admin.pagination.of')} {totalPages}
        </span>
        <button type="button" className="btn btn--outline admin-pagination-button admin-pagination-button--next"
                disabled={currentPage >= totalPages}
                onClick={() => onPageChange(currentPage + 1)}>{t('admin.pagination.next')}</button>
    </nav>;
}

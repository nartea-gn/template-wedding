import {useLocalization} from '../../app/providers/useLocalization';
import type {WeddingMessageKey} from '../../invitations/wedding';
import './PaginationControls.css';

type Props = { currentPage: number; totalPages: number; onPageChange: (page: number) => void };

export function PaginationControls({currentPage, totalPages, onPageChange}: Props) {
    const {t} = useLocalization<WeddingMessageKey>();
    if (totalPages <= 1) return null;
    return <nav className="admin-pagination" aria-label={t('admin.pagination.label')}>
        <button type="button" className="btn btn--outline admin-pagination-button" disabled={currentPage <= 1}
                onClick={() => onPageChange(currentPage - 1)}>{t('admin.pagination.previous')}</button>
        <span className="admin-pagination-status" aria-live="polite">
            {t('admin.pagination.page')} {currentPage} {t('admin.pagination.of')} {totalPages}
        </span>
        <button type="button" className="btn btn--outline admin-pagination-button" disabled={currentPage >= totalPages}
                onClick={() => onPageChange(currentPage + 1)}>{t('admin.pagination.next')}</button>
    </nav>;
}

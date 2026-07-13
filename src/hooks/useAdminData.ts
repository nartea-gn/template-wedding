import {useCallback, useEffect, useMemo, useState} from 'react';
import {listRsvpResponses} from '../features/rsvp/application/listRsvpResponses';
import type {RsvpSubmissionRecord} from '../features/rsvp/domain/RsvpSubmission';
import type {AdminSortOrder} from '../core/invitation';
import {
    type AdminFilter,
    getPresentedResponses,
    isAttending,
    needsTransport,
} from '../features/admin/presentation/getPresentedResponses';
import {weddingInvitation} from '../invitations/wedding';
import {weddingRsvpRepository} from '../invitations/wedding/rsvpRepository';

type Options = {
    locale: string;
    defaultSort: AdminSortOrder;
    paginationEnabled: boolean;
    pageSize: number;
};

export function useAdminData(isAuthenticated: boolean, options: Options) {
    const [responses, setResponses] = useState<RsvpSubmissionRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [hasError, setHasError] = useState(false);
    const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null);
    const [filter, setFilterState] = useState<AdminFilter>('all');
    const [query, setQueryState] = useState('');
    const [sortOrder, setSortOrderState] = useState<AdminSortOrder>(options.defaultSort);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSizeState] = useState(options.pageSize);
    const admin = weddingInvitation.capabilities.admin;
    const metrics = admin?.metrics;
    const identityFieldId = weddingInvitation.capabilities.rsvp?.form.submission.identityFieldId ?? '';

    const fetchResponses = useCallback(async () => {
        try {
            setLoading(true);
            setHasError(false);
            setResponses(await listRsvpResponses(weddingRsvpRepository, weddingInvitation.id));
            setLastUpdatedAt(new Date());
        } catch (cause) {
            console.error('Failed to load RSVP responses', cause);
            setHasError(true);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- authenticated data fetching is intentional
        if (isAuthenticated) void fetchResponses();
    }, [isAuthenticated, fetchResponses]);

    const presentedResponses = useMemo(() => getPresentedResponses({
        responses,
        filter,
        query,
        sortOrder,
        identityFieldId,
        metrics,
        locale: options.locale,
    }), [filter, identityFieldId, metrics, options.locale, query, responses, sortOrder]);
    const effectivePageSize = options.paginationEnabled ? pageSize : Math.max(1, presentedResponses.length);
    const totalPages = Math.max(1, Math.ceil(presentedResponses.length / effectivePageSize));
    const currentPage = Math.min(page, totalPages);
    const pageStart = (currentPage - 1) * effectivePageSize;
    const paginatedResponses = presentedResponses.slice(pageStart, pageStart + effectivePageSize);
    const resetPage = () => setPage(1);
    const setFilter = (value: AdminFilter) => {
        setFilterState(value);
        resetPage();
    };
    const setQuery = (value: string) => {
        setQueryState(value);
        resetPage();
    };
    const setSortOrder = (value: AdminSortOrder) => {
        setSortOrderState(value);
        resetPage();
    };
    const setPageSize = (value: number) => {
        setPageSizeState(value);
        resetPage();
    };

    return {
        loading,
        hasError,
        lastUpdatedAt,
        filter,
        setFilter,
        query,
        setQuery,
        sortOrder,
        setSortOrder,
        totalResponses: responses.length,
        attendingResponses: responses.filter(response => isAttending(response, metrics)).length,
        declinedResponses: responses.filter(response => !isAttending(response, metrics)).length,
        transportResponses: responses.filter(response => needsTransport(response, metrics)).length,
        resultCount: presentedResponses.length,
        presentedResponses,
        paginatedResponses,
        currentPage,
        totalPages,
        pageSize,
        setPageSize,
        setPage,
        refetch: fetchResponses,
    };
}

export type {AdminFilter};

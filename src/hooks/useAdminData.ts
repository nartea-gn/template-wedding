import {useCallback, useEffect, useMemo, useState} from 'react';
import {listRsvpResponses, updateRsvpResponse, softDeleteRsvpResponse, restoreRsvpResponse, purgeExpiredRsvpResponses} from '../features/rsvp/application/adminRsvpActions';
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
    const [loading, setLoading] = useState(false);
    const [hasError, setHasError] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [actionMessage, setActionMessage] = useState<string | null>(null);
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
            setErrorMessage(null);
            setResponses(await listRsvpResponses(weddingRsvpRepository, weddingInvitation.id));
            setLastUpdatedAt(new Date());
        } catch (cause) {
            console.error('Failed to load RSVP responses', cause);
            setHasError(true);
            setErrorMessage(cause instanceof Error ? cause.message : String(cause));
        } finally {
            setLoading(false);
        }
    }, []);

    const purgeExpired = useCallback(async () => {
        try {
            setLoading(true);
            setHasError(false);
            setErrorMessage(null);
            await purgeExpiredRsvpResponses(weddingRsvpRepository, weddingInvitation.id)
            setActionMessage('admin.actions.purged')
            setTimeout(() => setActionMessage(null), 3000)
            await fetchResponses()
        } catch (cause) {
            console.error('Failed to purge expired RSVP responses', cause);
            setHasError(true);
            setErrorMessage(cause instanceof Error ? cause.message : String(cause));
        } finally {
            setLoading(false);
        }
    }, [fetchResponses]);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- authenticated data fetching is intentional
        if (isAuthenticated) void fetchResponses();
    }, [isAuthenticated, fetchResponses]);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- automatic retention purge on dashboard load
        if (isAuthenticated) void purgeExpired();
    }, [isAuthenticated, purgeExpired]);

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

    const updateResponse = useCallback(async (id: number, changes: Partial<Pick<RsvpSubmissionRecord, 'answers' | 'full_name' | 'attending' | 'dietary_options' | 'dietary_other' | 'bus_option' | 'song_request' | 'message' | 'locale'>>) => {
        try {
            setLoading(true);
            setHasError(false);
            setErrorMessage(null);
            const updated = await updateRsvpResponse(weddingRsvpRepository, weddingInvitation.id, id, changes)
            setResponses(prev => prev.map(item => item.id === id ? updated : item))
            setActionMessage('admin.actions.updated')
            setTimeout(() => setActionMessage(null), 3000)
        } catch (cause) {
            console.error('Failed to update RSVP response', cause);
            setHasError(true);
            setErrorMessage(cause instanceof Error ? cause.message : String(cause));
        } finally {
            setLoading(false);
        }
    }, []);

    const deleteResponse = useCallback(async (id: number) => {
        try {
            setLoading(true);
            setHasError(false);
            setErrorMessage(null);
            await softDeleteRsvpResponse(weddingRsvpRepository, weddingInvitation.id, id)
            setResponses(prev => prev.map(item => item.id === id ? {...item, deletedAt: new Date().toISOString()} : item))
            setActionMessage('admin.actions.deleted')
            setTimeout(() => setActionMessage(null), 3000)
        } catch (cause) {
            console.error('Failed to delete RSVP response', cause);
            setHasError(true);
            setErrorMessage(cause instanceof Error ? cause.message : String(cause));
        } finally {
            setLoading(false);
        }
    }, []);

    const restoreResponse = useCallback(async (id: number) => {
        try {
            setLoading(true);
            setHasError(false);
            setErrorMessage(null);
            await restoreRsvpResponse(weddingRsvpRepository, weddingInvitation.id, id)
            setResponses(prev => prev.map(item => item.id === id ? {...item, deletedAt: undefined, deletedBy: undefined} : item))
            setActionMessage('admin.actions.restored')
            setTimeout(() => setActionMessage(null), 3000)
        } catch (cause) {
            console.error('Failed to restore RSVP response', cause);
            setHasError(true);
            setErrorMessage(cause instanceof Error ? cause.message : String(cause));
        } finally {
            setLoading(false);
        }
    }, []);

    return {
        loading,
        hasError,
        errorMessage,
        actionMessage,
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
        updateResponse,
        deleteResponse,
        restoreResponse,
        purgeExpired,
    };
}

export type {AdminFilter};

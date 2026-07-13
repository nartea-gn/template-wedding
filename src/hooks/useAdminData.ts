import {useCallback, useEffect, useState} from 'react';
import {listRsvpResponses} from '../features/rsvp/application/listRsvpResponses';
import type {RsvpSubmissionRecord} from '../features/rsvp/domain/RsvpSubmission';
import {weddingInvitation} from '../invitations/wedding';
import {weddingRsvpRepository} from '../invitations/wedding/rsvpRepository';

export type Filter = 'all' | 'confirmed' | 'declined' | 'bus';

export function useAdminData(isAuthenticated: boolean) {
    const [responses, setResponses] = useState<RsvpSubmissionRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [hasError, setHasError] = useState(false);
    const [filter, setFilter] = useState<Filter>('all');
    const metrics = weddingInvitation.capabilities.admin?.metrics;
    const fetchResponses = useCallback(async () => {
        try {
            setLoading(true);
            setHasError(false);
            setResponses(await listRsvpResponses(weddingRsvpRepository, weddingInvitation.id));
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
    const attending = (response: RsvpSubmissionRecord) => metrics ? response.answers[metrics.attendanceFieldId] === true : false;
    const needsTransport = (response: RsvpSubmissionRecord) => {
        if (!metrics?.transportFieldId || !attending(response)) return false;
        const value = response.answers[metrics.transportFieldId];
        return Boolean(value) && value !== metrics.ownTransportValue;
    };
    const filteredResponses = responses.filter(response => {
        if (filter === 'confirmed') return attending(response);
        if (filter === 'declined') return !attending(response);
        if (filter === 'bus') return needsTransport(response);
        return true;
    });
    return {
        loading, hasError, filter, setFilter, totalRespuestas: responses.length,
        confirmados: responses.filter(attending).length,
        declinados: responses.filter(response => !attending(response)).length,
        necesitanBus: responses.filter(needsTransport).length,
        filteredResponses, refetch: fetchResponses
    };
}

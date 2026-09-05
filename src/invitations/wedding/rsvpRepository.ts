import {supabase} from '../../lib/supabaseClient'
import {SupabaseRsvpRepository} from '../../infrastructure/supabase/SupabaseRsvpRepository'
import {readWeddingLegacyAnswers, toWeddingLegacyColumns} from './rsvpColumns'

export const weddingRsvpRepository = new SupabaseRsvpRepository(supabase, {
    toColumns: toWeddingLegacyColumns,
    readAnswers: readWeddingLegacyAnswers,
})

import {supabase} from '../../lib/supabaseClient'
import {SupabaseRsvpRepository} from '../../infrastructure/supabase/SupabaseRsvpRepository'

export const weddingRsvpRepository = new SupabaseRsvpRepository(supabase)

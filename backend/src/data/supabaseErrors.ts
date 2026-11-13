import type { PostgrestError } from '@supabase/supabase-js'
import { DatabaseError, NotFoundError } from '../errors'

// PostgREST returns this when .single() finds no row.
const NO_ROWS = 'PGRST116'

/** Throw the right AppError for a Supabase query result. `what` names the record for 404s. */
export function throwIfError(error: PostgrestError | null, what = 'record'): void {
    if (!error) return
    if (error.code === NO_ROWS) throw new NotFoundError(`${what} not found`)
    throw new DatabaseError(error.message, error)
}

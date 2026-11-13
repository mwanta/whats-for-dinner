import { SupabaseClient } from '@supabase/supabase-js'
import type { Injury } from '@whats-for-dinner/types'
import { throwIfError } from './supabaseErrors'

export class InjuryRepository {
    constructor(private supabase: SupabaseClient) {}

    async getActive(userId: string): Promise<Injury[]> {
        const { data, error } = await this.supabase
            .from('injuries')
            .select('*')
            .eq('user_id', userId)
            .eq('active', true)

        throwIfError(error, 'injuries')

        return (data ?? []).map((i: any) => ({
            id: i.injury_id,
            bodyPart: i.body_part,
            injuryType: i.injury_type,
            restrictions: i.restrictions ?? [],
            nutritionNotes: i.nutrition_notes,
            active: i.active
        }))
    }

    /** Delete the user's injuries and insert the given list as active. */
    async replaceAll(userId: string, injuries: Omit<Injury, 'id'>[]): Promise<void> {
        const { error: deleteError } = await this.supabase.from('injuries').delete().eq('user_id', userId)
        throwIfError(deleteError, 'injuries')

        if (injuries.length === 0) return
        const { error } = await this.supabase.from('injuries').insert(
            injuries.map(i => ({
                user_id: userId,
                body_part: i.bodyPart,
                injury_type: i.injuryType,
                restrictions: i.restrictions,
                active: true
            }))
        )
        throwIfError(error, 'injuries')
    }
}

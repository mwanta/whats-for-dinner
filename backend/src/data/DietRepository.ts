import { SupabaseClient } from '@supabase/supabase-js'
import type { DietaryPreferences, Deficiency } from '@whats-for-dinner/types'
import { throwIfError } from './supabaseErrors'

export class DietRepository {
    constructor(private supabase: SupabaseClient) {}

    async getPreferences(userId: string): Promise<DietaryPreferences> {
        const { data, error } = await this.supabase
            .from('dietary_preferences')
            .select('*')
            .eq('user_id', userId)
            .single()

        throwIfError(error, 'dietary preferences')

        return {
            dietType: data.diet_type,
            allergies: data.allergies ?? [],
            intolerances: data.intolerances ?? [],
            dislikedIngredients: data.disliked_ingredients ?? [],
            cuisinePreferences: data.cuisine_preferences ?? []
        }
    }

    async upsertPreferences(userId: string, data: DietaryPreferences): Promise<void> {
        const { error } = await this.supabase
            .from('dietary_preferences')
            .upsert(
                {
                    user_id: userId,
                    diet_type: data.dietType,
                    allergies: data.allergies,
                    intolerances: data.intolerances ?? [],
                    disliked_ingredients: data.dislikedIngredients ?? [],
                    cuisine_preferences: data.cuisinePreferences ?? []
                },
                { onConflict: 'user_id' }
            )

        throwIfError(error, 'dietary preferences')
    }

    async getDeficiencies(userId: string): Promise<Deficiency[]> {
        const { data, error } = await this.supabase
            .from('reported_deficiencies')
            .select('*')
            .eq('user_id', userId)

        throwIfError(error, 'deficiencies')

        return (data ?? []).map((d: any) => ({
            nutrient: d.nutrient,
            severity: d.severity,
            notes: d.notes
        }))
    }

    /** Delete the user's deficiencies and insert the given list. */
    async replaceDeficiencies(userId: string, deficiencies: Deficiency[]): Promise<void> {
        const { error: deleteError } = await this.supabase.from('reported_deficiencies').delete().eq('user_id', userId)
        throwIfError(deleteError, 'deficiencies')

        if (deficiencies.length === 0) return
        const { error } = await this.supabase.from('reported_deficiencies').insert(
            deficiencies.map(d => ({
                user_id: userId,
                nutrient: d.nutrient,
                severity: d.severity,
                notes: d.notes ?? null
            }))
        )
        throwIfError(error, 'deficiencies')
    }
}

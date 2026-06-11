import { SupabaseClient } from '@supabase/supabase-js'
import {DietaryPreferences, Deficiency, DIET_TYPES, SEVERITIES} from '@whats-for-dinner/types'

export class DietService {
    constructor(private supabase: SupabaseClient) {}

    async getDietaryPreferences(userId: string): Promise<DietaryPreferences> {
        const { data, error } = await this.supabase
            .from('dietary_preferences')
            .select('*')
            .eq('user_id', userId)
            .single()

        if (error) throw new Error(error.message)

        return {
            dietType: data.diet_type,
            allergies: data.allergies ?? [],
            intolerances: data.intolerances ?? [],
            dislikedIngredients: data.disliked_ingredients ?? [],
            cuisinePreferences: data.cuisine_preferences ?? []
        }
    }

    async saveDietaryPreferences(userId: string, data: DietaryPreferences): Promise<void> {
        if (!DIET_TYPES.includes(data.dietType)) {
            throw new Error(`dietType must be one of: ${DIET_TYPES.join(', ')}`)
        }
        if (!Array.isArray(data.allergies)) {
            throw new Error('allergies must be an array')
        }

        const { error } = await this.supabase
            .from('dietary_preferences')
            .upsert({
                user_id: userId,
                diet_type: data.dietType,
                allergies: data.allergies,
                intolerances: data.intolerances ?? [],
                disliked_ingredients: data.dislikedIngredients ?? [],
                cuisine_preferences: data.cuisinePreferences ?? []
            })

        if (error) throw new Error(error.message)
    }

    async getDeficiencies(userId: string): Promise<Deficiency[]> {
        const { data, error } = await this.supabase
            .from('reported_deficiencies')
            .select('*')
            .eq('user_id', userId)

        if (error) throw new Error(error.message)

        return (data ?? []).map((d: any) => ({
            nutrient: d.nutrient,
            severity: d.severity,
            notes: d.notes
        }))
    }

    async saveDeficiencies(userId: string, deficiencies: Deficiency[]): Promise<void> {
        if (!Array.isArray(deficiencies)) {
            throw new Error('deficiencies must be an array')
        }
        for (const d of deficiencies) {
            if (!SEVERITIES.includes(d.severity)) {
                throw new Error(`severity must be one of: ${SEVERITIES.join(', ')}`)
            }
        }

        await this.supabase.from('reported_deficiencies').delete().eq('user_id', userId)

        if (deficiencies.length > 0) {
            const { error } = await this.supabase.from('reported_deficiencies').insert(
                deficiencies.map(d => ({
                    user_id: userId,
                    nutrient: d.nutrient,
                    severity: d.severity,
                    notes: d.notes ?? null
                }))
            )
            if (error) throw new Error(error.message)
        }
    }
}
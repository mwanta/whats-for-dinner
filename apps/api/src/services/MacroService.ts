import { SupabaseClient } from '@supabase/supabase-js'
import { MacroTargets } from '@whats-for-dinner/types'
import { calculateMacroTargets } from '../lib/tdee'

export class MacroService {
    constructor(private supabase: SupabaseClient) {}

    async getMacroTargets(userId: string): Promise<MacroTargets> {
        const { data, error } = await this.supabase
            .from('macro_targets')
            .select('*')
            .eq('user_id', userId)
            .single()

        if (error) throw new Error(error.message)

        return {
            calories: data.calories,
            proteinG: data.protein_g,
            carbsG: data.carbs_g,
            fatG: data.fat_g,
            fiberG: data.fiber_g,
            leucineMg: data.leucine_mg,
            lysineMg: data.lysine_mg,
            methionineMg: data.methionine_mg,
            threonineMg: data.threonine_mg,
            tryptophanMg: data.tryptophan_mg,
            valineMg: data.valine_mg,
            isoleucineMg: data.isoleucine_mg,
            phenylalanineMg: data.phenylalanine_mg,
            histidineMg: data.histidine_mg
        }
    }

    async calculateAndSave(userId: string, data: {
        age: number
        weightKg: number
        heightCm: number
        sex: string
        activityLevel: string
        goal: string
    }): Promise<void> {
        if (data.age < 1 || data.age > 120) {
            throw new Error('age must be between 1 and 120')
        }
        if (data.weightKg < 1 || data.weightKg > 500) {
            throw new Error('weightKg must be between 1 and 500')
        }
        if (data.heightCm < 1 || data.heightCm > 300) {
            throw new Error('heightCm must be between 1 and 300')
        }

        const targets = calculateMacroTargets(data)

        const { error } = await this.supabase
            .from('macro_targets')
            .upsert({ user_id: userId, ...targets })

        if (error) throw new Error(error.message)
    }
}
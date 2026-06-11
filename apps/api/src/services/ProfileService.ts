import { SupabaseClient } from '@supabase/supabase-js'
import {ACTIVITY_LEVELS, GOALS, UserProfile} from '@whats-for-dinner/types'
import { calculateMacroTargets } from '../lib/tdee'
import { MacroService } from './MacroService'

export class ProfileService {
    constructor(private supabase: SupabaseClient) {}

    async getProfile(userId: string): Promise<UserProfile> {
        const { data, error } = await this.supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single()

        if (error) throw new Error(error.message)

        return {
            id: data.id,
            displayName: data.display_name,
            goal: data.goal,
            activityLevel: data.activity_level
        }
    }

    async saveGoals(userId: string, data: UserProfile & {
        age?: number
        weightKg?: number
        heightCm?: number
        sex?: string
    }): Promise<void> {
        if (!GOALS.includes(data.goal)) {
            throw new Error(`goal must be one of: ${GOALS.join(', ')}`)
        }
        if (!ACTIVITY_LEVELS.includes(data.activityLevel)) {
            throw new Error(`activityLevel must be one of: ${ACTIVITY_LEVELS.join(', ')}`)
        }

        const { error } = await this.supabase.from('profiles').upsert({
            id: userId,
            goal: data.goal,
            activity_level: data.activityLevel,
            age: data.age ?? null,
            weight_kg: data.weightKg ?? null,
            height_cm: data.heightCm ?? null,
            sex: data.sex ?? null
        })
        if (error) throw new Error(error.message)

        if (data.age && data.weightKg && data.heightCm && data.sex) {
            const macroService = new MacroService(this.supabase)
            await macroService.calculateAndSave(userId, {
                age: data.age,
                weightKg: data.weightKg,
                heightCm: data.heightCm,
                sex: data.sex,
                activityLevel: data.activityLevel,
                goal: data.goal
            })
        }
    }

    async updateProfile(userId: string, data: Partial<UserProfile>): Promise<void> {
        if (data.goal && !GOALS.includes(data.goal)) {
            throw new Error(`goal must be one of: ${GOALS.join(', ')}`)
        }
        if (data.activityLevel && !ACTIVITY_LEVELS.includes(data.activityLevel)) {
            throw new Error(`activityLevel must be one of: ${ACTIVITY_LEVELS.join(', ')}`)
        }

        const { error } = await this.supabase.from('profiles').update({
            goal: data.goal,
            activity_level: data.activityLevel,
            display_name: data.displayName
        }).eq('id', userId)

        if (error) throw new Error(error.message)
    }
}
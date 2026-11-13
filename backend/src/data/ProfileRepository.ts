import { SupabaseClient } from '@supabase/supabase-js'
import type { UserProfile } from '@whats-for-dinner/types'
import { throwIfError } from './supabaseErrors'

export type BodyMetrics = {
    age?: number
    weightKg?: number
    heightCm?: number
    sex?: string
}

export class ProfileRepository {
    constructor(private supabase: SupabaseClient) {}

    async get(userId: string): Promise<UserProfile> {
        const { data, error } = await this.supabase
            .from('profiles')
            .select('*')
            .eq('profile_id', userId)
            .single()

        throwIfError(error, 'profile')

        return {
            id: data.profile_id,
            displayName: data.display_name,
            goal: data.goal,
            activityLevel: data.activity_level
        }
    }

    async upsertGoals(
        userId: string,
        data: Pick<UserProfile, 'goal' | 'activityLevel'> & BodyMetrics
    ): Promise<void> {
        const { error } = await this.supabase.from('profiles').upsert(
            {
                profile_id: userId,
                goal: data.goal,
                activity_level: data.activityLevel,
                age: data.age ?? null,
                weight_kg: data.weightKg ?? null,
                height_cm: data.heightCm ?? null,
                sex: data.sex ?? null
            },
            { onConflict: 'profile_id' }
        )
        throwIfError(error, 'profile')
    }

    async update(userId: string, data: Partial<UserProfile>): Promise<void> {
        const { error } = await this.supabase.from('profiles').update({
            goal: data.goal,
            activity_level: data.activityLevel,
            display_name: data.displayName
        }).eq('profile_id', userId)

        throwIfError(error, 'profile')
    }
}

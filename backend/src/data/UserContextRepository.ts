import { SupabaseClient } from '@supabase/supabase-js'
import type { UserContext } from '@whats-for-dinner/types'
import { throwIfError } from './supabaseErrors'

export type WorkoutPrefs = Pick<UserContext,
    'workoutDaysPerWeek' |
    'workoutSessionMin' |
    'preferredWorkoutTypes' |
    'fitnessGoalDetail'
>

export class UserContextRepository {
    constructor(private supabase: SupabaseClient) {}

    async get(userId: string): Promise<UserContext> {
        const { data, error } = await this.supabase
            .from('user_context')
            .select('*')
            .eq('user_id', userId)
            .single()

        throwIfError(error, 'user context')

        return {
            weekdayCookMin: data.weekday_cook_min,
            weekendCookMin: data.weekend_cook_min,
            weeklyBudgetUsd: data.weekly_budget_usd,
            perMealBudgetUsd: data.per_meal_budget_usd,
            cookingSkill: data.cooking_skill,
            equipment: data.equipment ?? [],
            workoutDaysPerWeek: data.workout_days_per_week,
            workoutSessionMin: data.workout_session_min,
            preferredWorkoutTypes: data.preferred_workout_types ?? [],
            fitnessGoalDetail: data.fitness_goal_detail ?? []
        }
    }

    async upsertCookingContext(userId: string, data: Partial<UserContext>): Promise<void> {
        const { error } = await this.supabase.from('user_context').upsert(
            {
                user_id: userId,
                weekday_cook_min: data.weekdayCookMin ?? 30,
                weekend_cook_min: data.weekendCookMin ?? 60,
                weekly_budget_usd: data.weeklyBudgetUsd ?? null,
                per_meal_budget_usd: data.perMealBudgetUsd ?? null,
                cooking_skill: data.cookingSkill,
                equipment: data.equipment ?? []
            },
            { onConflict: 'user_id' }
        )

        throwIfError(error, 'user context')
    }

    async updateWorkoutPrefs(userId: string, data: WorkoutPrefs): Promise<void> {
        const { error } = await this.supabase
            .from('user_context')
            .update({
                workout_days_per_week: data.workoutDaysPerWeek,
                workout_session_min: data.workoutSessionMin,
                preferred_workout_types: data.preferredWorkoutTypes,
                fitness_goal_detail: data.fitnessGoalDetail
            })
            .eq('user_id', userId)

        throwIfError(error, 'user context')
    }
}

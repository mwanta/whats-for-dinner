import { SupabaseClient } from '@supabase/supabase-js'
import { UserContext, COOKING_SKILLS, FITNESS_GOALS } from '@whats-for-dinner/types'

export class UserContextService {
    constructor(private supabase: SupabaseClient) {}

    async getContext(userId: string): Promise<UserContext> {
        const { data, error } = await this.supabase
            .from('user_context')
            .select('*')
            .eq('user_id', userId)
            .single()

        if (error) throw new Error(error.message)

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

    async saveContext(userId: string, data: Partial<UserContext>): Promise<void> {
        if (data.cookingSkill && !COOKING_SKILLS.includes(data.cookingSkill)) {
            throw new Error(`cookingSkill must be one of: ${COOKING_SKILLS.join(', ')}`)
        }
        if (data.weekdayCookMin !== undefined && typeof data.weekdayCookMin !== 'number') {
            throw new Error('weekdayCookMin must be a number')
        }
        if (data.weekendCookMin !== undefined && typeof data.weekendCookMin !== 'number') {
            throw new Error('weekendCookMin must be a number')
        }
        if (data.equipment && !Array.isArray(data.equipment)) {
            throw new Error('equipment must be an array')
        }

        const { error } = await this.supabase.from('user_context').upsert({
            user_id: userId,
            weekday_cook_min: data.weekdayCookMin ?? 30,
            weekend_cook_min: data.weekendCookMin ?? 60,
            weekly_budget_usd: data.weeklyBudgetUsd ?? null,
            per_meal_budget_usd: data.perMealBudgetUsd ?? null,
            cooking_skill: data.cookingSkill,
            equipment: data.equipment ?? []
        })

        if (error) throw new Error(error.message)
    }

    async saveWorkoutPrefs(userId: string, data: Pick<UserContext,
        'workoutDaysPerWeek' |
        'workoutSessionMin' |
        'preferredWorkoutTypes' |
        'fitnessGoalDetail'
    >): Promise<void> {
        if (typeof data.workoutDaysPerWeek !== 'number' ||
            data.workoutDaysPerWeek < 1 ||
            data.workoutDaysPerWeek > 7) {
            throw new Error('workoutDaysPerWeek must be a number between 1 and 7')
        }
        if (!Array.isArray(data.fitnessGoalDetail) || data.fitnessGoalDetail.length === 0) {
            throw new Error('at least one fitness goal is required')
        }
        for (const goal of data.fitnessGoalDetail) {
            if (!FITNESS_GOALS.includes(goal as any)) {
                throw new Error(`fitnessGoal must be one of: ${FITNESS_GOALS.join(', ')}`)
            }
        }
        if (!Array.isArray(data.preferredWorkoutTypes)) {
            throw new Error('preferredWorkoutTypes must be an array')
        }

        const { error } = await this.supabase
            .from('user_context')
            .update({
                workout_days_per_week: data.workoutDaysPerWeek,
                workout_session_min: data.workoutSessionMin,
                preferred_workout_types: data.preferredWorkoutTypes,
                fitness_goal_detail: data.fitnessGoalDetail
            })
            .eq('user_id', userId)

        if (error) throw new Error(error.message)
    }
}
import { SupabaseClient } from '@supabase/supabase-js'
import { WorkoutRecommendation, WORKOUT_TYPES } from '@whats-for-dinner/types'
import { InjuryService } from './InjuryService'
import { UserContextService } from './UserContextService'

export class WorkoutService {
    private injuryService: InjuryService
    private contextService: UserContextService

    constructor(private supabase: SupabaseClient) {
        this.injuryService = new InjuryService(supabase)
        this.contextService = new UserContextService(supabase)
    }

    async getInjurySafeWorkouts(
        userId: string,
        workoutType?: string
    ): Promise<WorkoutRecommendation[]> {
        if (workoutType && !WORKOUT_TYPES.includes(workoutType as any)) {
            throw new Error(`workoutType must be one of: ${WORKOUT_TYPES.join(', ')}`)
        }

        const restrictions = await this.injuryService.getAllRestrictions(userId)
        const nutritionNotes = await this.injuryService.getNutritionNotes(userId)

        let query = this.supabase.from('workouts').select('*')
        if (workoutType) query = query.eq('workout_type', workoutType)

        const { data, error } = await query
        if (error) throw new Error(error.message)

        const safeWorkouts = (data ?? []).filter((w: any) => {
            const contraindications: string[] = w.contraindications ?? []
            return !contraindications.some(c => restrictions.includes(c))
        })

        return safeWorkouts.map((w: any) => ({
            name: w.name,
            workoutType: w.workout_type,
            bearingType: w.bearing_type,
            durationMin: w.duration_min,
            muscleGroups: w.muscle_groups ?? [],
            nutritionNotes: nutritionNotes.join(' ') || w.nutrition_notes,
            reasoning: this.buildReasoning(w, restrictions)
        }))
    }

    async generateWeeklyPlan(
        userId: string
    ): Promise<Record<string, WorkoutRecommendation[]>> {
        const context = await this.contextService.getContext(userId)
        const allWorkouts = await this.getInjurySafeWorkouts(userId)

        const days = [
            'monday', 'tuesday', 'wednesday',
            'thursday', 'friday', 'saturday', 'sunday'
        ]
        const workoutDays = days.slice(0, context.workoutDaysPerWeek)
        const types = context.preferredWorkoutTypes.length > 0
            ? context.preferredWorkoutTypes
            : ['strength', 'cardio', 'mobility']

        const plan: Record<string, WorkoutRecommendation[]> = {}

        workoutDays.forEach((day, index) => {
            const targetType = types[index % types.length]
            const matching = allWorkouts.filter(w => w.workoutType === targetType)
            plan[day] = matching.slice(0, 2)
        })

        return plan
    }

    private buildReasoning(workout: any, restrictions: string[]): string {
        if (restrictions.length === 0) {
            return `${workout.name} matches your fitness preferences.`
        }
        return `${workout.name} is safe for your restrictions (${restrictions.join(', ')}) and targets ${(workout.muscle_groups ?? []).join(', ')}.`
    }
}
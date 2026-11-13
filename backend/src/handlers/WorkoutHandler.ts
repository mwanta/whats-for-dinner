import { WorkoutRecommendation, WORKOUT_TYPES } from '@whats-for-dinner/types'
import type { Workout, WorkoutRepository } from '../data/WorkoutRepository'
import type { InjuryHandler } from './InjuryHandler'
import type { UserContextHandler } from './UserContextHandler'
import { ValidationError } from '../errors'

export class WorkoutHandler {
    constructor(
        private readonly workouts: WorkoutRepository,
        private readonly injuryHandler: InjuryHandler,
        private readonly contextHandler: UserContextHandler
    ) {}

    async getInjurySafeWorkouts(
        userId: string,
        workoutType?: string
    ): Promise<WorkoutRecommendation[]> {
        if (workoutType && !WORKOUT_TYPES.includes(workoutType as any)) {
            throw new ValidationError(`workoutType must be one of: ${WORKOUT_TYPES.join(', ')}`)
        }

        const restrictions = await this.injuryHandler.getAllRestrictions(userId)
        const nutritionNotes = await this.injuryHandler.getNutritionNotes(userId)
        const workouts = await this.workouts.list(workoutType)

        const safeWorkouts = workouts.filter(
            w => !w.contraindications.some(c => restrictions.includes(c))
        )

        return safeWorkouts.map(w => ({
            name: w.name,
            workoutType: w.workoutType,
            bearingType: w.bearingType,
            durationMin: w.durationMin,
            muscleGroups: w.muscleGroups,
            nutritionNotes: nutritionNotes.join(' ') || w.nutritionNotes,
            reasoning: this.buildReasoning(w, restrictions)
        }))
    }

    async generateWeeklyPlan(
        userId: string
    ): Promise<Record<string, WorkoutRecommendation[]>> {
        const context = await this.contextHandler.getContext(userId)
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

    private buildReasoning(workout: Workout, restrictions: string[]): string {
        if (restrictions.length === 0) {
            return `${workout.name} matches your fitness preferences.`
        }
        return `${workout.name} is safe for your restrictions (${restrictions.join(', ')}) and targets ${workout.muscleGroups.join(', ')}.`
    }
}

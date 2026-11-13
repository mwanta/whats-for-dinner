import { UserContext, COOKING_SKILLS, FITNESS_GOALS } from '@whats-for-dinner/types'
import type { UserContextRepository, WorkoutPrefs } from '../data/UserContextRepository'
import { ValidationError } from '../errors'

export class UserContextHandler {
    constructor(private readonly context: UserContextRepository) {}

    async getContext(userId: string): Promise<UserContext> {
        return this.context.get(userId)
    }

    async saveContext(userId: string, data: Partial<UserContext>): Promise<void> {
        if (data.cookingSkill && !COOKING_SKILLS.includes(data.cookingSkill)) {
            throw new ValidationError(`cookingSkill must be one of: ${COOKING_SKILLS.join(', ')}`)
        }
        if (data.weekdayCookMin !== undefined && typeof data.weekdayCookMin !== 'number') {
            throw new ValidationError('weekdayCookMin must be a number')
        }
        if (data.weekendCookMin !== undefined && typeof data.weekendCookMin !== 'number') {
            throw new ValidationError('weekendCookMin must be a number')
        }
        if (data.equipment && !Array.isArray(data.equipment)) {
            throw new ValidationError('equipment must be an array')
        }
        await this.context.upsertCookingContext(userId, data)
    }

    async saveWorkoutPrefs(userId: string, data: WorkoutPrefs): Promise<void> {
        if (typeof data.workoutDaysPerWeek !== 'number' ||
            data.workoutDaysPerWeek < 1 ||
            data.workoutDaysPerWeek > 7) {
            throw new ValidationError('workoutDaysPerWeek must be a number between 1 and 7')
        }
        if (!Array.isArray(data.fitnessGoalDetail) || data.fitnessGoalDetail.length === 0) {
            throw new ValidationError('at least one fitness goal is required')
        }
        for (const goal of data.fitnessGoalDetail) {
            if (!FITNESS_GOALS.includes(goal as any)) {
                throw new ValidationError(`fitnessGoal must be one of: ${FITNESS_GOALS.join(', ')}`)
            }
        }
        if (!Array.isArray(data.preferredWorkoutTypes)) {
            throw new ValidationError('preferredWorkoutTypes must be an array')
        }
        await this.context.updateWorkoutPrefs(userId, data)
    }
}

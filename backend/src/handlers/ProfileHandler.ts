import { ACTIVITY_LEVELS, GOALS, UserProfile } from '@whats-for-dinner/types'
import type { BodyMetrics, ProfileRepository } from '../data/ProfileRepository'
import type { MacroHandler } from './MacroHandler'
import { ValidationError } from '../errors'

export class ProfileHandler {
    constructor(
        private readonly profiles: ProfileRepository,
        private readonly macros: MacroHandler
    ) {}

    async getProfile(userId: string): Promise<UserProfile> {
        return this.profiles.get(userId)
    }

    async saveGoals(userId: string, data: UserProfile & BodyMetrics): Promise<void> {
        if (!GOALS.includes(data.goal)) {
            throw new ValidationError(`goal must be one of: ${GOALS.join(', ')}`)
        }
        if (!ACTIVITY_LEVELS.includes(data.activityLevel)) {
            throw new ValidationError(`activityLevel must be one of: ${ACTIVITY_LEVELS.join(', ')}`)
        }

        await this.profiles.upsertGoals(userId, data)

        // Macro targets depend on body metrics, so recalculate them whenever all four are present.
        if (data.age && data.weightKg && data.heightCm && data.sex) {
            await this.macros.calculateAndSave(userId, {
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
            throw new ValidationError(`goal must be one of: ${GOALS.join(', ')}`)
        }
        if (data.activityLevel && !ACTIVITY_LEVELS.includes(data.activityLevel)) {
            throw new ValidationError(`activityLevel must be one of: ${ACTIVITY_LEVELS.join(', ')}`)
        }
        await this.profiles.update(userId, data)
    }
}

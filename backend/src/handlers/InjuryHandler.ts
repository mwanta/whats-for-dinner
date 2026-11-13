import { Injury, INJURY_TYPES } from '@whats-for-dinner/types'
import type { InjuryRepository } from '../data/InjuryRepository'
import { ValidationError } from '../errors'

export class InjuryHandler {
    constructor(private readonly injuries: InjuryRepository) {}

    async getActiveInjuries(userId: string): Promise<Injury[]> {
        return this.injuries.getActive(userId)
    }

    async saveInjuries(userId: string, injuries: Omit<Injury, 'id'>[]): Promise<void> {
        if (!Array.isArray(injuries)) {
            throw new ValidationError('injuries must be an array')
        }
        for (const injury of injuries) {
            if (!INJURY_TYPES.includes(injury.injuryType)) {
                throw new ValidationError(`injuryType must be one of: ${INJURY_TYPES.join(', ')}`)
            }
            if (!Array.isArray(injury.restrictions)) {
                throw new ValidationError('restrictions must be an array')
            }
        }
        await this.injuries.replaceAll(userId, injuries)
    }

    async getAllRestrictions(userId: string): Promise<string[]> {
        const injuries = await this.getActiveInjuries(userId)
        return [...new Set(injuries.flatMap(i => i.restrictions))]
    }

    async getNutritionNotes(userId: string): Promise<string[]> {
        const injuries = await this.getActiveInjuries(userId)
        return injuries
            .map(i => i.nutritionNotes)
            .filter((n): n is string => !!n)
    }
}

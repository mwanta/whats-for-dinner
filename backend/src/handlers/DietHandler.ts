import { DietaryPreferences, Deficiency, DIET_TYPES, SEVERITIES } from '@whats-for-dinner/types'
import type { DietRepository } from '../data/DietRepository'
import { ValidationError } from '../errors'

export class DietHandler {
    constructor(private readonly diet: DietRepository) {}

    async getDietaryPreferences(userId: string): Promise<DietaryPreferences> {
        return this.diet.getPreferences(userId)
    }

    async saveDietaryPreferences(userId: string, data: DietaryPreferences): Promise<void> {
        if (!DIET_TYPES.includes(data.dietType)) {
            throw new ValidationError(`dietType must be one of: ${DIET_TYPES.join(', ')}`)
        }
        if (!Array.isArray(data.allergies)) {
            throw new ValidationError('allergies must be an array')
        }
        await this.diet.upsertPreferences(userId, data)
    }

    async getDeficiencies(userId: string): Promise<Deficiency[]> {
        return this.diet.getDeficiencies(userId)
    }

    async saveDeficiencies(userId: string, deficiencies: Deficiency[]): Promise<void> {
        if (!Array.isArray(deficiencies)) {
            throw new ValidationError('deficiencies must be an array')
        }
        for (const d of deficiencies) {
            if (!SEVERITIES.includes(d.severity)) {
                throw new ValidationError(`severity must be one of: ${SEVERITIES.join(', ')}`)
            }
        }
        await this.diet.replaceDeficiencies(userId, deficiencies)
    }
}

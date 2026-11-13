import type { MacroTargets } from '@whats-for-dinner/types'
import type { MacroRepository } from '../data/MacroRepository'
import { calculateAminoAcidTargets } from './aminoAcidTargets'
import { calculateEnergyTargets, type EnergyInput } from './energyTargets'
import { ValidationError } from '../errors'

export class MacroHandler {
    constructor(private readonly macros: MacroRepository) {}

    async getMacroTargets(userId: string): Promise<MacroTargets> {
        return this.macros.get(userId)
    }

    async calculateAndSave(userId: string, data: EnergyInput): Promise<void> {
        if (data.age < 1 || data.age > 120) {
            throw new ValidationError('age must be between 1 and 120')
        }
        if (data.weightKg < 1 || data.weightKg > 500) {
            throw new ValidationError('weightKg must be between 1 and 500')
        }
        if (data.heightCm < 1 || data.heightCm > 300) {
            throw new ValidationError('heightCm must be between 1 and 300')
        }

        await this.macros.upsert(userId, {
            ...calculateEnergyTargets(data),
            ...calculateAminoAcidTargets(data.weightKg)
        })
    }
}

// Daily calories and macros: Mifflin-St Jeor BMR -> TDEE -> goal adjustment -> macro split.
import type { EnergyTargets } from '@whats-for-dinner/types'

const ACTIVITY_MULTIPLIERS: Record<string, number> = {
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    very_active: 1.9
}

const GOAL_ADJUSTMENTS: Record<string, number> = {
    cut: -500,
    bulk: 300,
    maintain: 0,
}

export interface EnergyInput {
    age: number
    weightKg: number
    heightCm: number
    sex: string
    activityLevel: string
    goal: string
}

export function calculateEnergyTargets(p: EnergyInput): EnergyTargets {
    const bmr = p.sex === 'male'
        ? 10 * p.weightKg + 6.25 * p.heightCm - 5 * p.age + 5
        : 10 * p.weightKg + 6.25 * p.heightCm - 5 * p.age - 161

    const tdee = bmr * (ACTIVITY_MULTIPLIERS[p.activityLevel] ?? 1.55)
    const calories = Math.round(tdee + (GOAL_ADJUSTMENTS[p.goal] ?? 0))

    // Standard macro splits adjusted for goal
    const proteinG = Math.round(p.weightKg * (p.goal === 'bulk' ? 2.2 : 1.8))
    const fatG = Math.round((calories * 0.25) / 9)
    const carbsG = Math.round((calories - proteinG * 4 - fatG * 9) / 4)
    const fiberG = p.sex === 'male' ? 38 : 25

    return { calories, proteinG, carbsG, fatG, fiberG }
}

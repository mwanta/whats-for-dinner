// Mifflin-St Jeor BMR → TDEE → macro targets

const ACTIVITY_MULTIPLIERS: Record<string, number> = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    very_active: 1.9
}

const GOAL_ADJUSTMENTS: Record<string, number> = {
    cut: -500,
    bulk: 300,
    maintain: 0,
    performance: 200,
    longevity: 0
}

// WHO recommended EAA daily targets (mg per kg bodyweight)
const EAA_PER_KG: Record<string, number> = {
    leucine_mg: 39,
    lysine_mg: 30,
    methionine_mg: 15,
    threonine_mg: 20,
    tryptophan_mg: 6,
    valine_mg: 26,
    isoleucine_mg: 20,
    phenylalanine_mg: 25,
    histidine_mg: 10
}

interface ProfileInput {
    age: number
    weightKg: number
    heightCm: number
    sex: string
    activityLevel: string
    goal: string
}

export function calculateMacroTargets(p: ProfileInput) {
    // BMR (Mifflin-St Jeor)
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

    // EAA targets based on bodyweight
    const eaas = Object.fromEntries(
        Object.entries(EAA_PER_KG).map(([key, mgPerKg]) => [key, Math.round(mgPerKg * p.weightKg)])
    )

    return { calories, protein_g: proteinG, carbs_g: carbsG, fat_g: fatG, fiber_g: fiberG, ...eaas }
}
// Shared types used by both mobile app and Hono API

export type AgentEventType = 'thinking' | 'tool_call' | 'tool_result' | 'recommendation' | 'done' | 'error'

export type AgentEvent = {
    type: AgentEventType
    payload: any
}

export type MealRecommendation = {
    name: string
    reasoning: string
    calories: number
    protein_g: number
    carbs_g: number
    fat_g: number
    fiber_g: number
    eaaContribution: string[]
    complementaryMeals?: string[]
    workoutSynergy?: string
}


export type MacroTargets = {
    calories: number
    proteinG: number
    carbsG: number
    fatG: number
    fiberG: number
    leucineMg: number
    lysineMg: number
    methionineMg: number
    threonineMg: number
    tryptophanMg: number
    valineMg: number
    isoleucineMg: number
    phenylalanineMg: number
    histidineMg: number
}

export type UserProfile = {
    id: string
    displayName: string
    goal: typeof GOALS[number]
    activityLevel: typeof ACTIVITY_LEVELS[number]
}

export type DietaryPreferences = {
    dietType: typeof DIET_TYPES[number]
    allergies: string[]
    intolerances: string[]
    dislikedIngredients: string[]
    cuisinePreferences: string[]
}

export type Deficiency = {
    nutrient: string
    severity: typeof SEVERITIES[number]
    notes?: string
}

export type Injury = {
    id: string
    bodyPart: string
    injuryType: typeof INJURY_TYPES[number]
    restrictions: string[]
    nutritionNotes?: string
    active: boolean
}

export type WorkoutRecommendation = {
    name: string
    workoutType: string
    bearingType: string
    durationMin: number
    muscleGroups: string[]
    nutritionNotes?: string
    reasoning: string
}

export type UserContext = {
    weekdayCookMin: number
    weekendCookMin: number
    weeklyBudgetUsd?: number
    perMealBudgetUsd?: number
    cookingSkill: typeof COOKING_SKILLS[number]
    equipment: typeof COOKING_EQUIPMENT[number][]
    workoutDaysPerWeek: WorkoutDaysPerWeek
    workoutSessionMin: number
    preferredWorkoutTypes: typeof WORKOUT_TYPES[number][]
    fitnessGoalDetail: typeof FITNESS_GOALS[number]
}

export type FullProfile = {
    profile: UserProfile
    diet: DietaryPreferences
    deficiencies: Deficiency[]
    injuries: Injury[]
    context: UserContext
    macros: MacroTargets
}

// UserProfile Parameters
export const GOALS = ['cut', 'bulk', 'maintain', 'performance', 'longevity'] as const
export const ACTIVITY_LEVELS = ['sedentary', 'light', 'moderate', 'active', 'very_active'] as const

// Context Parameters
export const COOKING_SKILLS = ['beginner', 'intermediate', 'advanced'] as const
export const COOKING_EQUIPMENT = ['oven', 'stovetop', 'air_fryer', 'blender', 'grill'] as const

// Workout Preference Parameters
export type WorkoutDaysPerWeek = 1 | 2 | 3 | 4 | 5 | 6 | 7
export const WORKOUT_TYPES = ['strength', 'cardio', 'yoga', 'mobility', 'bodyweight', 'hiit'] as const
export const FITNESS_GOALS = ['build_muscle', 'improve_endurance', 'increase_flexibility', 'general_fitness'] as const

// Diet Parameters
export const DIET_TYPES = ['none', 'vegetarian', 'vegan', 'pescatarian'] as const
export const SEVERITIES = ['mild', 'moderate', 'severe'] as const
export const COMMON_ALLERGIES = ['peanuts', 'tree nuts', 'dairy', 'gluten', 'eggs', 'soy', 'shellfish'] as const
export const CUISINES = ['mediterranean', 'asian', 'mexican', 'american', 'italian', 'indian', 'middle eastern'] as const
export const NUTRIENTS = [
    { key: 'iron', label: 'Iron' },
    { key: 'b12', label: 'Vitamin B12' },
    { key: 'vitamin_d', label: 'Vitamin D' },
    { key: 'calcium', label: 'Calcium' },
    { key: 'omega3', label: 'Omega-3' },
    { key: 'zinc', label: 'Zinc' },
    { key: 'magnesium', label: 'Magnesium' },
    { key: 'folate', label: 'Folate' },
] as const

// Injury parameters
export const BODY_PARTS = ['lower body', 'upper body', 'spinal'] as const
export const INJURY_TYPES = ['chronic', 'recovering'] as const
export const RESTRICTIONS = ['low_impact', 'non_weight_bearing', 'avoid_overhead', 'no_spinal_flexion', 'upper_body_only', 'lower_body_only', 'seated_only'] as const
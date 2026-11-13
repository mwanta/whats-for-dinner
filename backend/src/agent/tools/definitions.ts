import type { RecipeApi } from '../../data/external/RecipeApi'
import type { UsdaApi } from '../../data/external/UsdaApi'
import type { FullProfileHandler } from '../../handlers/FullProfileHandler'
import type { NutritionHandler } from '../../handlers/NutritionHandler'
import type { WorkoutHandler } from '../../handlers/WorkoutHandler'
import type { Tool } from './ToolRegistry'

export type ToolDependencies = {
    fullProfile: FullProfileHandler
    nutrition: NutritionHandler
    workouts: WorkoutHandler
    recipes: RecipeApi
    usda: UsdaApi
}

export function createTools(deps: ToolDependencies): Tool[] {
    return [
        {
            definition: {
                type: 'function',
                function: {
                    name: 'get_user_profile',
                    description: 'Get the full user profile including dietary preferences, macro targets, injuries, deficiencies, and cooking context.',
                    parameters: { type: 'object', properties: {}, required: [] }
                }
            },
            execute: (_args, { userId }) => deps.fullProfile.get(userId)
        },
        {
            definition: {
                type: 'function',
                function: {
                    name: 'search_usda',
                    description: 'Look up amino acid and detailed nutrient data for a specific ingredient, to verify essential amino acid coverage of a recipe.',
                    parameters: {
                        type: 'object',
                        properties: { query: { type: 'string', description: 'Ingredient name, e.g. "lentils" or "quinoa"' } },
                        required: ['query']
                    }
                }
            },
            execute: (args) => deps.usda.search(args.query)
        },
        {
            definition: {
                type: 'function',
                function: {
                    name: 'search_recipes',
                    description: 'Search for real recipes from a live recipe database, filtered by diet, allergies, macros, and prep time.',
                    parameters: {
                        type: 'object',
                        properties: {
                            query: { type: 'string', description: 'Search term, e.g. "high protein dinner"' },
                            diet: { type: 'string', description: 'e.g. vegan, vegetarian, ketogenic, paleo' },
                            intolerances: { type: 'array', items: { type: 'string' }, description: 'e.g. peanut, dairy, gluten' },
                            maxReadyTime: { type: 'number' },
                            minProtein: { type: 'number' },
                            maxCalories: { type: 'number' }
                        },
                        required: []
                    }
                }
            },
            execute: (args) => deps.recipes.search(args)
        },
        {
            definition: {
                type: 'function',
                function: {
                    name: 'check_eaa_coverage',
                    description: 'Check if a list of meals provides complete essential amino acid coverage for the day.',
                    parameters: {
                        type: 'object',
                        properties: {
                            meal_names: { type: 'array', items: { type: 'string' }, description: 'List of meal names to check coverage for' }
                        },
                        required: ['meal_names']
                    }
                }
            },
            execute: (args) => deps.nutrition.checkEAACoverage(args.meal_names)
        },
        {
            definition: {
                type: 'function',
                function: {
                    name: 'get_injury_safe_workouts',
                    description: 'Get workouts that are safe given the user\'s active injuries and movement restrictions, to suggest nutrition-workout synergy.',
                    parameters: { type: 'object', properties: {}, required: [] }
                }
            },
            execute: (_args, { userId }) => deps.workouts.getInjurySafeWorkouts(userId)
        }
    ]
}

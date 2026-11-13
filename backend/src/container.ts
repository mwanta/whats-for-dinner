/**
 * Composition root: the only place that constructs repositories, handlers and
 * the agent, and decides which concrete implementation each one gets.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { Agent } from './agent/Agent'
import { GroqClient } from './agent/llm/GroqClient'
import type { LlmClient } from './agent/llm/LlmClient'
import { createTools } from './agent/tools/definitions'
import { ToolRegistry } from './agent/tools/ToolRegistry'
import { DietRepository } from './data/DietRepository'
import { RecipeApi } from './data/external/RecipeApi'
import { UsdaApi } from './data/external/UsdaApi'
import { InjuryRepository } from './data/InjuryRepository'
import { MacroRepository } from './data/MacroRepository'
import { ProfileRepository } from './data/ProfileRepository'
import { UserContextRepository } from './data/UserContextRepository'
import { WorkoutRepository } from './data/WorkoutRepository'
import { DietHandler } from './handlers/DietHandler'
import { FullProfileHandler } from './handlers/FullProfileHandler'
import { InjuryHandler } from './handlers/InjuryHandler'
import { MacroHandler } from './handlers/MacroHandler'
import { NutritionHandler } from './handlers/NutritionHandler'
import { ProfileHandler } from './handlers/ProfileHandler'
import { UserContextHandler } from './handlers/UserContextHandler'
import { WorkoutHandler } from './handlers/WorkoutHandler'

export function createContainer(supabase: SupabaseClient, llm: LlmClient = new GroqClient()) {
    const macro = new MacroHandler(new MacroRepository(supabase))
    const profile = new ProfileHandler(new ProfileRepository(supabase), macro)
    const diet = new DietHandler(new DietRepository(supabase))
    const injury = new InjuryHandler(new InjuryRepository(supabase))
    const context = new UserContextHandler(new UserContextRepository(supabase))
    const workout = new WorkoutHandler(new WorkoutRepository(supabase), injury, context)
    const fullProfile = new FullProfileHandler(profile, diet, injury, context, macro)
    const nutrition = new NutritionHandler()

    const tools = new ToolRegistry(createTools({
        fullProfile,
        nutrition,
        workouts: workout,
        recipes: new RecipeApi(),
        usda: new UsdaApi()
    }))

    return {
        handlers: { profile, macro, diet, injury, context, workout, fullProfile, nutrition },
        agent: new Agent(llm, tools)
    }
}

export type Container = ReturnType<typeof createContainer>

import Groq from 'groq-sdk'
import type { ChatCompletionMessageParam, ChatCompletionTool } from 'groq-sdk/resources/chat/completions'
import { SupabaseClient } from '@supabase/supabase-js'
import { FullProfileService } from '../FullProfileService'
import { WorkoutService } from '../WorkoutService'
import {UsdaService} from "./UsdaService";
import {NutritionService} from "../NutritionService";
import {AgentEvent} from '@whats-for-dinner/types'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

const SYSTEM_PROMPT = `You are NutriAgent, an expert nutrition and meal planning assistant.
You help users find recipes that meet their macro targets, dietary preferences, and nutrition goals.
You have deep knowledge of protein quality, essential amino acids, and plant-based nutrition.

When recommending meals:
- Always check the user's remaining macro targets
- For plant-based users, verify essential amino acid coverage across the day
- Flag incomplete proteins and suggest complementary pairings
- Respect dietary restrictions, allergies, and cuisine preferences
- Consider cooking time and budget constraints
- Surface nutrition-injury connections when relevant (e.g. omega-3s for inflammation)

Always respond with a JSON array of meal recommendations, each matching this shape:
{
  "name": string,
  "reasoning": string,
  "calories": number,
  "protein_g": number,
  "carbs_g": number,
  "fat_g": number,
  "fiber_g": number,
  "eaaContribution": string[],
  "complementaryMeals": string[],
  "workoutSynergy": string | null
}`

const tools: ChatCompletionTool[] = [
    {
        type: 'function',
        function: {
            name: 'get_user_profile',
            description: 'Get the full user profile including dietary preferences, macro targets, injuries, deficiencies, and cooking context.',
            parameters: { type: 'object', properties: {}, required: [] }
        }
    },
    {
        type: 'function',
        function: {
            name: 'search_usda',
            description: 'Search USDA FoodData Central for nutrition data including amino acid profiles for an ingredient or food.',
            parameters: {
                type: 'object',
                properties: { query: { type: 'string', description: 'Food or ingredient to search for' } },
                required: ['query']
            }
        }
    },
    {
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
    {
        type: 'function',
        function: {
            name: 'get_injury_safe_workouts',
            description: 'Get workouts that are safe given the user\'s active injuries and movement restrictions, to suggest nutrition-workout synergy.',
            parameters: { type: 'object', properties: {}, required: [] }
        }
    }
]

export class AgentService {
    private profileService: FullProfileService
    private usdaService: UsdaService
    private nutritionService: NutritionService
    private workoutService: WorkoutService

    constructor(private supabase: SupabaseClient) {
        this.profileService = new FullProfileService(supabase)
        this.usdaService = new UsdaService()
        this.nutritionService = new NutritionService()
        this.workoutService = new WorkoutService(supabase)
    }

    private async executeTool(toolName: string, args: Record<string, any>, userId: string): Promise<string> {
        switch (toolName) {
            case 'get_user_profile': {
                const profile = await this.profileService.get(userId)
                return JSON.stringify(profile)
            }
            case 'search_usda': {
                const results = await this.usdaService.search(args.query)
                return JSON.stringify(results)
            }
            case 'check_eaa_coverage': {
                const coverage = await this.nutritionService.checkEAACoverage(args.meal_names)
                return JSON.stringify(coverage)
            }
            case 'get_injury_safe_workouts': {
                const workouts = await this.workoutService.getInjurySafeWorkouts(userId)
                return JSON.stringify(workouts)
            }
            default:
                return JSON.stringify({ error: `Unknown tool: ${toolName}` })
        }
    }

    async *run(userId: string, userMessage: string): AsyncGenerator<AgentEvent> {
        const messages: ChatCompletionMessageParam[] = [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: userMessage }
        ]

        yield { type: 'thinking', payload: 'Checking your profile and nutrition goals...' }

        let iterations = 0
        const MAX_ITERATIONS = 6

        while (iterations < MAX_ITERATIONS) {
            iterations++

            const response = await groq.chat.completions.create({
                model: 'llama-3.3-70b-versatile',
                messages,
                tools,
                tool_choice: 'auto',
                max_completion_tokens: 4096
            })

            const message = response.choices[0].message
            messages.push(message as ChatCompletionMessageParam)

            if (!message.tool_calls || message.tool_calls.length === 0) {
                try {
                    const content = message.content ?? ''
                    const jsonMatch = content.match(/\[[\s\S]*\]/)
                    if (jsonMatch) {
                        const parsed = JSON.parse(jsonMatch[0])
                        yield { type: 'recommendation', payload: parsed }
                    } else {
                        yield { type: 'recommendation', payload: { text: content } }
                    }
                } catch {
                    yield { type: 'recommendation', payload: { text: message.content } }
                }
                yield { type: 'done', payload: null }
                return
            }

            for (const toolCall of message.tool_calls) {
                const toolName = toolCall.function.name
                const args = JSON.parse(toolCall.function.arguments)

                yield { type: 'tool_call', payload: { tool: toolName, args } }

                const result = await this.executeTool(toolName, args, userId)

                yield { type: 'tool_result', payload: { tool: toolName, result: JSON.parse(result) } }

                messages.push({
                    role: 'tool',
                    tool_call_id: toolCall.id,
                    content: result
                } as ChatCompletionMessageParam)
            }
        }

        yield { type: 'error', payload: { error: 'Agent exceeded maximum iterations' } }
    }
}
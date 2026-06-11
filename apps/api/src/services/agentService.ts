import Groq from 'groq-sdk'
import { searchUSDA } from './usdaService'
import { checkEAACoverage } from './nutritionService'
import type { ChatCompletionMessageParam } from 'groq-sdk/resources/chat/completions'
import type { AgentEvent, MealRecommendation } from '@whats-for-dinner/types'
import {FullProfileService} from "./FullProfileService";
import {supabase} from "../lib/supabase";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

const SYSTEM_PROMPT = `You are an expert nutrition and meal planning assistant.
You help users find recipes that meet their macro targets, dietary preferences, and nutrition goals.
You have deep knowledge of protein quality, essential amino acids, and plant-based nutrition.

When recommending meals:
- Always check the user's remaining macro targets
- For plant-based users, verify essential amino acid coverage across the day
- Flag incomplete proteins and suggest complementary pairings
- Respect dietary restrictions, allergies, and cuisine preferences
- Consider cooking time and budget constraints
- Surface nutrition-injury connections when relevant (e.g. omega-3s for inflammation)

Always respond with structured JSON matching the MealRecommendation schema.`

const tools: Groq.Chat.ChatCompletionTool[] = [
    {
        type: 'function',
        function: {
            name: 'get_user_profile',
            description: 'Get the full user profile including dietary preferences, macro targets, injuries, deficiencies, and cooking context.',
            parameters: {
                type: 'object',
                properties: {},
                required: []
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'search_usda',
            description: 'Search USDA FoodData Central for nutrition data including amino acid profiles for an ingredient or food.',
            parameters: {
                type: 'object',
                properties: {
                    query: { type: 'string', description: 'Food or ingredient to search for' }
                },
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
                    meal_names: {
                        type: 'array',
                        items: { type: 'string' },
                        description: 'List of meal names to check coverage for'
                    }
                },
                required: ['meal_names']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'get_injury_nutrition_notes',
            description: 'Get nutrition recommendations relevant to the user\'s active injuries.',
            parameters: {
                type: 'object',
                properties: {},
                required: []
            }
        }
    }
]

async function executeTool(
    toolName: string,
    args: Record<string, any>,
    userId: string
): Promise<string> {
    switch (toolName) {
        case 'get_user_profile': {
            const service = new FullProfileService(supabase)
            const profile = await service.get(userId)
            return JSON.stringify(profile)
        }
        case 'search_usda': {
            const results = await searchUSDA(args.query)
            return JSON.stringify(results)
        }
        case 'check_eaa_coverage': {
            const coverage = await checkEAACoverage(args.meal_names)
            return JSON.stringify(coverage)
        }
        case 'get_injury_nutrition_notes': {
            const service = new FullProfileService(supabase)
            const profile = await service.get(userId)
            const injuries = profile.injuries ?? []
            const notes = injuries.map((i: any) => ({
                body_part: i.body_part,
                nutrition_notes: i.nutrition_notes
            })).filter((i: any) => i.nutrition_notes)
            return JSON.stringify(notes)
        }
        default:
            return JSON.stringify({ error: `Unknown tool: ${toolName}` })
    }
}

export async function* runAgent(
    userId: string,
    userMessage: string
): AsyncGenerator<AgentEvent> {
    const messages: ChatCompletionMessageParam[] = [
        { role: 'user', content: userMessage }
    ]

    yield { type: 'thinking', payload: 'Checking your profile and nutrition goals...' }

    // Agentic loop — keep going until the model stops calling tools
    while (true) {
        const response = await groq.chat.completions.create({
            model: 'llama-3.3-70b-versatile',
            messages,
            tools,
            tool_choice: 'auto',
            max_completion_tokens: 4096
        })

        const message = response.choices[0].message
        messages.push(message as ChatCompletionMessageParam)

        // No more tool calls — final answer
        if (!message.tool_calls || message.tool_calls.length === 0) {
            try {
                const content = message.content ?? ''
                // Try to parse as JSON recommendations
                const jsonMatch = content.match(/\[[\s\S]*\]|\{[\s\S]*\}/)
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
            break
        }

        // Execute each tool call
        for (const toolCall of message.tool_calls) {
            const toolName = toolCall.function.name
            const args = JSON.parse(toolCall.function.arguments)

            yield {
                type: 'tool_call',
                payload: { tool: toolName, args }
            }

            const result = await executeTool(toolName, args, userId)

            yield {
                type: 'tool_result',
                payload: { tool: toolName, result: JSON.parse(result) }
            }

            messages.push({
                role: 'tool',
                tool_call_id: toolCall.id,
                content: result
            } as ChatCompletionMessageParam)
        }
    }
}
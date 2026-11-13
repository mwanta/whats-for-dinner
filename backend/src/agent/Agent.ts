import type { AgentEvent } from '@whats-for-dinner/types'
import type { ChatMessage, LlmClient } from './llm/LlmClient'
import { parseRecommendation } from './parseRecommendation'
import { SYSTEM_PROMPT } from './SystemPrompt'
import type { ToolRegistry } from './tools/ToolRegistry'

const DEFAULT_MAX_ITERATIONS = 6

/** Runs the conversation: ask the model, run the tools it requests, repeat until it answers. */
export class Agent {
    constructor(
        private readonly llm: LlmClient,
        private readonly tools: ToolRegistry,
        private readonly systemPrompt = SYSTEM_PROMPT,
        private readonly maxIterations = DEFAULT_MAX_ITERATIONS
    ) {}

    async *run(userId: string, userMessage: string): AsyncGenerator<AgentEvent> {
        const messages: ChatMessage[] = [
            { role: 'system', content: this.systemPrompt },
            { role: 'user', content: userMessage }
        ]

        yield { type: 'thinking', payload: 'Checking your profile and nutrition goals...' }

        for (let iteration = 0; iteration < this.maxIterations; iteration++) {
            const message = await this.llm.complete(messages, this.tools.definitions())
            messages.push(message as ChatMessage)

            if (!message.tool_calls || message.tool_calls.length === 0) {
                yield { type: 'recommendation', payload: parseRecommendation(message.content) }
                yield { type: 'done', payload: null }
                return
            }

            for (const toolCall of message.tool_calls) {
                const tool = toolCall.function.name
                const args = JSON.parse(toolCall.function.arguments)

                yield { type: 'tool_call', payload: { tool, args } }
                const result = await this.tools.execute(tool, args, { userId })
                yield { type: 'tool_result', payload: { tool, result } }

                messages.push({ role: 'tool', tool_call_id: toolCall.id, content: JSON.stringify(result) })
            }
        }

        yield { type: 'error', payload: { error: 'Agent exceeded maximum iterations' } }
    }
}

import Groq from 'groq-sdk'
import type { AssistantMessage, ChatMessage, LlmClient, ToolDefinition } from './LlmClient'

const DEFAULT_MODEL = 'openai/gpt-oss-120b'
const MAX_COMPLETION_TOKENS = 4096

export class GroqClient implements LlmClient {
    private groq: Groq

    constructor(
        apiKey = process.env.GROQ_API_KEY,
        private readonly model = DEFAULT_MODEL
    ) {
        this.groq = new Groq({ apiKey })
    }

    async complete(messages: ChatMessage[], tools: ToolDefinition[]): Promise<AssistantMessage> {
        const response = await this.groq.chat.completions.create({
            model: this.model,
            messages,
            tools,
            tool_choice: 'auto',
            max_completion_tokens: MAX_COMPLETION_TOKENS
        })
        return response.choices[0].message
    }
}

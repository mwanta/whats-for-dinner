import type {
    ChatCompletionMessage,
    ChatCompletionMessageParam,
    ChatCompletionTool
} from 'groq-sdk/resources/chat/completions'

// OpenAI-style chat types. Groq's SDK defines them; other providers use the same shape.
export type ChatMessage = ChatCompletionMessageParam
export type AssistantMessage = ChatCompletionMessage
export type ToolDefinition = ChatCompletionTool

/** One round trip to a chat model that may answer or request tool calls. */
export interface LlmClient {
    complete(messages: ChatMessage[], tools: ToolDefinition[]): Promise<AssistantMessage>
}

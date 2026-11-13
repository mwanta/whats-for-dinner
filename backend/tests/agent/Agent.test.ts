import { describe, it, expect, vi } from 'vitest'
import type { AgentEvent } from '@whats-for-dinner/types'
import { Agent } from '../../src/agent/Agent'
import type { AssistantMessage, LlmClient } from '../../src/agent/llm/LlmClient'
import { parseRecommendation } from '../../src/agent/parseRecommendation'
import { ToolRegistry, type Tool } from '../../src/agent/tools/ToolRegistry'

/** An LLM that replies with the given messages in order. */
function scriptedLlm(...replies: Partial<AssistantMessage>[]): LlmClient {
    const queue = [...replies]
    return { complete: vi.fn(async () => (queue.shift() ?? replies[replies.length - 1]) as AssistantMessage) }
}

function toolCall(name: string, args: object = {}) {
    return {
        role: 'assistant' as const,
        content: null,
        tool_calls: [{ id: `call_${name}`, type: 'function' as const, function: { name, arguments: JSON.stringify(args) } }]
    }
}

const profileTool: Tool = {
    definition: { type: 'function', function: { name: 'get_user_profile', parameters: { type: 'object', properties: {} } } },
    execute: vi.fn(async (_args, { userId }) => ({ userId, dietType: 'vegan' }))
}

async function collect(agent: Agent): Promise<AgentEvent[]> {
    const events: AgentEvent[] = []
    for await (const e of agent.run('user-1', 'Suggest a vegan dinner')) events.push(e)
    return events
}

describe('Agent', () => {
    it('runs requested tools, then yields the parsed recommendation and done', async () => {
        const meals = [{ name: 'Lentil curry', protein_g: 22 }]
        const llm = scriptedLlm(
            toolCall('get_user_profile'),
            { role: 'assistant', content: `Here you go:\n${JSON.stringify(meals)}` }
        )
        const events = await collect(new Agent(llm, new ToolRegistry([profileTool])))

        expect(events.map(e => e.type)).toEqual(['thinking', 'tool_call', 'tool_result', 'recommendation', 'done'])
        expect(profileTool.execute).toHaveBeenCalledWith({}, { userId: 'user-1' })
        expect(events[2].payload.result).toEqual({ userId: 'user-1', dietType: 'vegan' })
        expect(events[3].payload).toEqual(meals)
    })

    it('reports an unknown tool back to the model instead of throwing', async () => {
        const llm = scriptedLlm(toolCall('not_a_tool'), { role: 'assistant', content: 'done' })
        const events = await collect(new Agent(llm, new ToolRegistry([profileTool])))

        expect(events.find(e => e.type === 'tool_result')!.payload.result).toEqual({ error: 'Unknown tool: not_a_tool' })
        expect(events.at(-1)!.type).toBe('done')
    })

    it('stops with an error event after the iteration limit', async () => {
        const llm = scriptedLlm(toolCall('get_user_profile'))
        const events = await collect(new Agent(llm, new ToolRegistry([profileTool]), 'prompt', 3))

        expect(events.filter(e => e.type === 'tool_call')).toHaveLength(3)
        expect(events.at(-1)).toEqual({ type: 'error', payload: { error: 'Agent exceeded maximum iterations' } })
    })
})

describe('parseRecommendation', () => {
    it('extracts a JSON array from surrounding prose', () => {
        expect(parseRecommendation('Sure! [{"name":"Tofu bowl"}] Enjoy.')).toEqual([{ name: 'Tofu bowl' }])
    })

    it('falls back to the raw text when there is no valid array', () => {
        expect(parseRecommendation('No meals today')).toEqual({ text: 'No meals today' })
        expect(parseRecommendation('[not json]')).toEqual({ text: '[not json]' })
    })
})

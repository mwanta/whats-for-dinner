import type { ToolDefinition } from '../llm/LlmClient'

export type ToolContext = { userId: string }

/** A function the model can call: its schema plus how to run it. */
export type Tool = {
    definition: ToolDefinition
    execute(args: Record<string, any>, context: ToolContext): Promise<unknown>
}

export class ToolRegistry {
    private byName: Map<string, Tool>

    constructor(tools: Tool[]) {
        this.byName = new Map(tools.map(t => {
            const name = t.definition.function?.name
            if (!name) throw new Error('Tool definition is missing function.name')
            return [name, t]
        }))
    }

    definitions(): ToolDefinition[] {
        return [...this.byName.values()].map(t => t.definition)
    }

    /** Run a tool by name. An unknown name is reported back to the model, not thrown. */
    async execute(name: string, args: Record<string, any>, context: ToolContext): Promise<unknown> {
        const tool = this.byName.get(name)
        if (!tool) return { error: `Unknown tool: ${name}` }
        return tool.execute(args, context)
    }
}

import { Hono } from 'hono'
import { streamSSE } from 'hono/streaming'
import type { Agent } from '../agent/Agent'
import type { AppEnv } from '../middleware/auth'

const DEFAULT_PROMPT = 'Suggest meals for this week that meet my nutrition goals.'

export function recommendationRoutes(agent: Agent) {
    const app = new Hono<AppEnv>()

    // GET /api/recommendations/stream?prompt=...
    app.get('/stream', async (c) => {
        const userId = c.get('userId')
        const prompt = c.req.query('prompt') ?? DEFAULT_PROMPT

        // Once streaming starts the status is already 200, so errors can't go
        // through errorHandler. They're sent as an SSE error event instead.
        return streamSSE(c, async (stream) => {
            try {
                for await (const event of agent.run(userId, prompt)) {
                    await stream.writeSSE({ data: JSON.stringify(event), event: event.type })
                }
            } catch (e: any) {
                console.error('[agent] stream failed:', e)
                await stream.writeSSE({ data: JSON.stringify({ error: 'Agent failed' }), event: 'error' })
            }
        })
    })

    return app
}

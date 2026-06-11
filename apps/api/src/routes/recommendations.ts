import { Hono } from 'hono'
import { streamSSE } from 'hono/streaming'
import { runAgent } from '../services/agentService'

type Variables = { userId: string }
const app = new Hono<{ Variables: Variables }>()

// GET /api/recommendations/stream?prompt=...
app.get('/stream', async (c) => {
    const userId = c.get('userId')
    const prompt = c.req.query('prompt') ?? 'Suggest meals for this week that meet my nutrition goals.'

    return streamSSE(c, async (stream) => {
        try {
            for await (const event of runAgent(userId, prompt)) {
                await stream.writeSSE({
                    data: JSON.stringify(event),
                    event: event.type
                })
            }
        } catch (e: any) {
            await stream.writeSSE({
                data: JSON.stringify({ error: e.message }),
                event: 'error'
            })
        }
    })
})

export default app
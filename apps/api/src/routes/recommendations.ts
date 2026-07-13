import { Hono } from 'hono'
import { streamSSE } from 'hono/streaming'
import { AgentService } from '../services/external_calls/AgentService'
import {supabase} from "../lib/supabase";

type Variables = { userId: string }
const app = new Hono<{ Variables: Variables }>()

// GET /api/recommendations/stream?prompt=...
app.get('/stream', async (c) => {
    const userId = c.get('userId')
    const prompt = c.req.query('prompt') ?? 'Suggest meals for this week that meet my nutrition goals.'

    return streamSSE(c, async (stream) => {
        try {
            const agent = new AgentService(supabase)
            for await (const event of agent.run(userId, prompt)) {
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
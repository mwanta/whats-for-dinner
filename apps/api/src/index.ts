import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { createClient } from '@supabase/supabase-js'
import profile from './routes/profile'
import recommendations from './routes/recommendations'

type Variables = { userId: string }
const app = new Hono<{ Variables: Variables }>()

app.use('*', cors())

app.use('/api/*', async (c, next) => {
    const authHeader = c.req.header('Authorization')
    if (!authHeader) return c.json({ error: 'Unauthorized' }, 401)

    const token = authHeader.replace('Bearer ', '')
    const supabase = createClient(
        process.env.SUPABASE_URL!,
        process.env.SUPABASE_ANON_KEY!
    )

    const { data: { user }, error } = await supabase.auth.getUser(token)
    if (error || !user) return c.json({ error: 'Unauthorized' }, 401)

    c.set('userId', user.id)
    await next()
})

app.get('/', (c) => c.json({ status: 'ok' }))
app.route('/api/profile', profile)
app.route('/api/recommendations', recommendations)

serve({ fetch: app.fetch, port: 3000 }, (info) => {
    console.log(`Server running on http://localhost:${info.port}`)
})
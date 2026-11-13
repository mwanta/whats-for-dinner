import 'dotenv/config'
import { serve } from '@hono/node-server'
import { createApp } from './app'
import { createContainer } from './container'
import { supabase } from './data/supabase'

const app = createApp(createContainer(supabase))

export { app }

serve({ fetch: app.fetch, port: 3000, hostname: '0.0.0.0' }, (info) => {
    console.log(`Server running on http://localhost:${info.port}`)
})

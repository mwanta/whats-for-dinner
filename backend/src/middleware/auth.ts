/*
Verify a request is coming from a legitimate user.
 */

import { createMiddleware } from 'hono/factory'
import { createClient } from '@supabase/supabase-js'

/** Hono environment for every authenticated route: the user id the token resolved to. */
export type AppEnv = { Variables: { userId: string } }

export const authMiddleware = createMiddleware<AppEnv>(async (c, next) => {
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
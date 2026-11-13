import { describe, it, expect, vi } from 'vitest'
import { Hono } from 'hono'

vi.mock('@supabase/supabase-js', () => ({
    createClient: () => ({
        auth: {
            getUser: (token: string) =>
                token === 'valid-token'
                    ? Promise.resolve({ data: { user: { id: 'user-1' } }, error: null })
                    : Promise.resolve({ data: { user: null }, error: { message: 'invalid' } })
        }
    })
}))

import { authMiddleware } from '../../src/middleware/auth'

type Variables = { userId: string }

describe('authMiddleware', () => {
    const app = new Hono<{ Variables: Variables }>()
    app.use('/protected', authMiddleware)
    app.get('/protected', (c) => c.json({ userId: c.get('userId') }))

    it('rejects requests with no Authorization header', async () => {
        const res = await app.request('/protected')
        expect(res.status).toBe(401)
    }, 5000)

    it('rejects invalid tokens', async () => {
        const res = await app.request('/protected', {
            headers: { Authorization: 'Bearer bad-token' }
        })
        expect(res.status).toBe(401)
    }, 5000)

    it('accepts valid tokens and sets userId', async () => {
        const res = await app.request('/protected', {
            headers: { Authorization: 'Bearer valid-token' }
        })
        expect(res.status).toBe(200)
        const body = await res.json()
        expect(body.userId).toBe('user-1')
    }, 5000)
})
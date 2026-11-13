import { describe, it, expect } from 'vitest'
import { Hono } from 'hono'
import type { DietRepository } from '../../src/data/DietRepository'
import { DatabaseError, NotFoundError, errorHandler } from '../../src/errors'
import { DietHandler } from '../../src/handlers/DietHandler'
import type { AppEnv } from '../../src/middleware/auth'
import { profileRoutes } from '../../src/routes/profile'

/** Mount the profile routes the way app.ts does: errorHandler on the parent app. */
function appWith(handlers: Partial<Parameters<typeof profileRoutes>[0]>) {
    const app = new Hono<AppEnv>()
    app.use('*', async (c, next) => { c.set('userId', 'user-1'); await next() })
    app.onError(errorHandler)
    app.route('/api/profile', profileRoutes(handlers as Parameters<typeof profileRoutes>[0]))
    return app
}

const post = (app: Hono<AppEnv>, path: string, body: string) =>
    app.request(path, { method: 'POST', body, headers: { 'Content-Type': 'application/json' } })

const dietRepo = (overrides: Partial<DietRepository> = {}) =>
    ({ upsertPreferences: async () => {}, ...overrides }) as unknown as DietRepository

describe('profile routes error handling', () => {
    it('returns 400 with the message for invalid input', async () => {
        const app = appWith({ diet: new DietHandler(dietRepo()) })
        const res = await post(app, '/api/profile/diet', JSON.stringify({ dietType: 'carnivore', allergies: [] }))

        expect(res.status).toBe(400)
        expect(await res.json()).toMatchObject({ code: 'validation_error', error: expect.stringContaining('dietType') })
    })

    it('returns 400 when deficiencies is missing', async () => {
        const app = appWith({ diet: new DietHandler(dietRepo()) })
        const res = await post(app, '/api/profile/deficiencies', '{}')
        expect(res.status).toBe(400)
    })

    it('returns 400 for a malformed JSON body', async () => {
        const app = appWith({ diet: new DietHandler(dietRepo()) })
        const res = await post(app, '/api/profile/diet', '{not json')
        expect(res.status).toBe(400)
        expect((await res.json()).code).toBe('invalid_json')
    })

    it('returns 404 when the record does not exist', async () => {
        const app = appWith({ fullProfile: { get: async () => { throw new NotFoundError('profile not found') } } as any })
        const res = await app.request('/api/profile')
        expect(res.status).toBe(404)
    })

    it('returns 500 without leaking database details', async () => {
        const failing = dietRepo({ upsertPreferences: async () => { throw new DatabaseError('relation "secret_table" does not exist') } })
        const app = appWith({ diet: new DietHandler(failing) })
        const res = await post(app, '/api/profile/diet', JSON.stringify({ dietType: 'vegan', allergies: [] }))

        expect(res.status).toBe(500)
        const body = await res.json()
        expect(body.error).toBe('Internal server error')
        expect(JSON.stringify(body)).not.toContain('secret_table')
    })

    it('returns 200 on success', async () => {
        const app = appWith({ diet: new DietHandler(dietRepo()) })
        const res = await post(app, '/api/profile/diet', JSON.stringify({ dietType: 'vegan', allergies: [] }))
        expect(res.status).toBe(200)
    })
})

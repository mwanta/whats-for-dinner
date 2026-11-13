import { Hono } from 'hono'
import type { DietHandler } from '../handlers/DietHandler'
import type { FullProfileHandler } from '../handlers/FullProfileHandler'
import type { InjuryHandler } from '../handlers/InjuryHandler'
import type { ProfileHandler } from '../handlers/ProfileHandler'
import type { UserContextHandler } from '../handlers/UserContextHandler'
import type { AppEnv } from '../middleware/auth'

type ProfileRouteDeps = {
    fullProfile: FullProfileHandler
    profile: ProfileHandler
    diet: DietHandler
    injury: InjuryHandler
    context: UserContextHandler
}

// Errors thrown here are turned into responses by errorHandler (see app.ts).
export function profileRoutes(h: ProfileRouteDeps) {
    const app = new Hono<AppEnv>()

    app.get('/', async (c) => c.json(await h.fullProfile.get(c.get('userId'))))

    app.post('/goals', async (c) => {
        await h.profile.saveGoals(c.get('userId'), await c.req.json())
        return c.json({ success: true })
    })

    app.post('/diet', async (c) => {
        await h.diet.saveDietaryPreferences(c.get('userId'), await c.req.json())
        return c.json({ success: true })
    })

    app.post('/deficiencies', async (c) => {
        const { deficiencies } = await c.req.json()
        await h.diet.saveDeficiencies(c.get('userId'), deficiencies)
        return c.json({ success: true })
    })

    app.post('/injuries', async (c) => {
        const { injuries } = await c.req.json()
        await h.injury.saveInjuries(c.get('userId'), injuries)
        return c.json({ success: true })
    })

    app.post('/context', async (c) => {
        await h.context.saveContext(c.get('userId'), await c.req.json())
        return c.json({ success: true })
    })

    app.post('/workout-prefs', async (c) => {
        await h.context.saveWorkoutPrefs(c.get('userId'), await c.req.json())
        return c.json({ success: true })
    })

    return app
}

import { Hono } from 'hono'
import { supabase } from '../lib/supabase'
import { ProfileService } from '../services/ProfileService'
import { DietService } from '../services/DietService'
import { InjuryService } from '../services/InjuryService'
import { UserContextService } from '../services/UserContextService'
import { FullProfileService } from '../services/FullProfileService'

type Variables = { userId: string }
const app = new Hono<{ Variables: Variables }>()

app.get('/', async (c) => {
    try {
        const service = new FullProfileService(supabase)
        const profile = await service.get(c.get('userId'))
        return c.json(profile)
    } catch (e: any) {
        return c.json({ error: e.message }, 500)
    }
})

app.post('/goals', async (c) => {
    try {
        const service = new ProfileService(supabase)
        await service.saveGoals(c.get('userId'), await c.req.json())
        return c.json({ success: true })
    } catch (e: any) {
        return c.json({ error: e.message }, 500)
    }
})

app.post('/diet', async (c) => {
    try {
        const service = new DietService(supabase)
        await service.saveDietaryPreferences(c.get('userId'), await c.req.json())
        return c.json({ success: true })
    } catch (e: any) {
        return c.json({ error: e.message }, 500)
    }
})

app.post('/deficiencies', async (c) => {
    try {
        const { deficiencies } = await c.req.json()
        if (!Array.isArray(deficiencies)) return c.json({ error: 'deficiencies must be an array' }, 400)
        const service = new DietService(supabase)
        await service.saveDeficiencies(c.get('userId'), deficiencies)
        return c.json({ success: true })
    } catch (e: any) {
        return c.json({ error: e.message }, 500)
    }
})

app.post('/injuries', async (c) => {
    try {
        const { injuries } = await c.req.json()
        if (!Array.isArray(injuries)) return c.json({ error: 'injuries must be an array' }, 400)
        const service = new InjuryService(supabase)
        await service.saveInjuries(c.get('userId'), injuries)
        return c.json({ success: true })
    } catch (e: any) {
        return c.json({ error: e.message }, 500)
    }
})

app.post('/context', async (c) => {
    try {
        const service = new UserContextService(supabase)
        await service.saveContext(c.get('userId'), await c.req.json())
        return c.json({ success: true })
    } catch (e: any) {
        return c.json({ error: e.message }, 500)
    }
})

app.post('/workout-prefs', async (c) => {
    try {
        const service = new UserContextService(supabase)
        await service.saveWorkoutPrefs(c.get('userId'), await c.req.json())
        return c.json({ success: true })
    } catch (e: any) {
        return c.json({ error: e.message }, 500)
    }
})

export default app
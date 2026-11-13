import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest'
import { createClient } from '@supabase/supabase-js'

const TEST_USER_ID = '00000000-0000-0000-0000-000000000001'

vi.mock('@supabase/supabase-js', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@supabase/supabase-js')>()
    return {
        ...actual,
        createClient: (url: string, key: string) => {
            if (key === process.env.SUPABASE_ANON_KEY) {
                return {
                    auth: {
                        getUser: () => Promise.resolve({
                            data: { user: { id: TEST_USER_ID } },
                            error: null
                        })
                    }
                } as any
            }
            return actual.createClient(url, key)
        }
    }
})

let app: any
const adminSupabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
)

beforeAll(async () => {
    const mod = await import('../../src/index')
    app = mod.app

    await adminSupabase.from('profiles').upsert({
        profile_id: TEST_USER_ID,
        display_name: 'Test User',
        goal: 'maintain',
        activity_level: 'moderate'
    })

    await adminSupabase.from('dietary_preferences').upsert(
        { user_id: TEST_USER_ID, diet_type: 'vegan', allergies: [], intolerances: [], disliked_ingredients: [], cuisine_preferences: [] },
        { onConflict: 'user_id' }
    )

    await adminSupabase.from('macro_targets').upsert(
        {
            user_id: TEST_USER_ID,
            calories: 2000, protein_g: 100, carbs_g: 250, fat_g: 65, fiber_g: 30,
            leucine_mg: 2700, lysine_mg: 2100, methionine_mg: 1000, threonine_mg: 1400,
            tryptophan_mg: 400, valine_mg: 1800, isoleucine_mg: 1400, phenylalanine_mg: 1700, histidine_mg: 700
        },
        { onConflict: 'user_id' }
    )

    await adminSupabase.from('user_context').upsert(
        {
            user_id: TEST_USER_ID,
            weekday_cook_min: 30, weekend_cook_min: 60, cooking_skill: 'intermediate', equipment: [],
            workout_days_per_week: 3, workout_session_min: 45, preferred_workout_types: [], fitness_goal_detail: []
        },
        { onConflict: 'user_id' }
    )
})

afterAll(async () => {
    await adminSupabase.from('profiles').delete().eq('profile_id', TEST_USER_ID)
    await adminSupabase.from('dietary_preferences').delete().eq('user_id', TEST_USER_ID)
    await adminSupabase.from('macro_targets').delete().eq('user_id', TEST_USER_ID)
    await adminSupabase.from('user_context').delete().eq('user_id', TEST_USER_ID)
})

describe('GET /api/recommendations/stream', () => {
    it('streams at least one event within 40s using a fully seeded test user', async () => {
        const res = await app.request(
            '/api/recommendations/stream?prompt=Suggest%20one%20high%20protein%20vegan%20dinner',
            { headers: { Authorization: 'Bearer fake-token-doesnt-matter' } }
        )

        expect(res.status).toBe(200)
        expect(res.headers.get('content-type')).toContain('text/event-stream')

        const reader = res.body!.getReader()
        const decoder = new TextDecoder()

        const { value } = await reader.read()
        const raw = decoder.decode(value)
        console.log('First chunk received:', raw.slice(0, 300))

        expect(raw.includes('data:')).toBe(true)
    }, 40000)
})
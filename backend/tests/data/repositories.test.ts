import { describe, it, expect } from 'vitest'
import { InjuryRepository } from '../../src/data/InjuryRepository'
import { ProfileRepository } from '../../src/data/ProfileRepository'
import { DatabaseError, NotFoundError } from '../../src/errors'

/** Minimal stand-in for supabase.from(...).select().eq()... that resolves to `result`. */
function mockSupabase(result: { data: any; error: any }) {
    const chain: any = {
        select: () => chain,
        eq: () => chain,
        single: () => Promise.resolve(result),
        then: (resolve: any, reject: any) => Promise.resolve(result).then(resolve, reject)
    }
    return { from: () => chain } as any
}

describe('InjuryRepository', () => {
    it('maps rows to camelCase injuries', async () => {
        const repo = new InjuryRepository(mockSupabase({
            data: [{ injury_id: '1', body_part: 'left_knee', injury_type: 'chronic', restrictions: ['no_impact'], active: true }],
            error: null
        }))
        const [injury] = await repo.getActive('user-1')

        expect(injury).toMatchObject({ id: '1', bodyPart: 'left_knee', restrictions: ['no_impact'] })
    })
})

describe('Supabase errors', () => {
    it('turns "no rows" into NotFoundError', async () => {
        const repo = new ProfileRepository(mockSupabase({
            data: null,
            error: { code: 'PGRST116', message: 'JSON object requested, multiple (or no) rows returned' }
        }))
        await expect(repo.get('user-1')).rejects.toBeInstanceOf(NotFoundError)
    })

    it('turns other query failures into DatabaseError', async () => {
        const repo = new ProfileRepository(mockSupabase({
            data: null,
            error: { code: '42703', message: 'column profiles.profile_id does not exist' }
        }))
        await expect(repo.get('user-1')).rejects.toBeInstanceOf(DatabaseError)
    })
})

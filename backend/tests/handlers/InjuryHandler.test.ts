import { describe, it, expect, vi } from 'vitest'
import type { Injury } from '@whats-for-dinner/types'
import type { InjuryRepository } from '../../src/data/InjuryRepository'
import { ValidationError } from '../../src/errors'
import { InjuryHandler } from '../../src/handlers/InjuryHandler'

function fakeRepo(injuries: Injury[] = []) {
    return {
        getActive: vi.fn(async () => injuries),
        replaceAll: vi.fn(async () => {})
    } as unknown as InjuryRepository & { replaceAll: ReturnType<typeof vi.fn> }
}

const injury = (id: string, restrictions: string[]): Injury =>
    ({ id, bodyPart: 'knee', injuryType: 'chronic', restrictions, active: true })

describe('InjuryHandler', () => {
    it('deduplicates restrictions across multiple injuries', async () => {
        const handler = new InjuryHandler(fakeRepo([
            injury('1', ['no_impact']),
            injury('2', ['no_impact', 'avoid_overhead'])
        ]))
        expect(await handler.getAllRestrictions('user-1')).toEqual(['no_impact', 'avoid_overhead'])
    })

    it('rejects an unknown injury type without touching the repository', async () => {
        const repo = fakeRepo()
        const handler = new InjuryHandler(repo)
        const bad = [{ bodyPart: 'knee', injuryType: 'sprained', restrictions: [], active: true }] as any

        await expect(handler.saveInjuries('user-1', bad)).rejects.toBeInstanceOf(ValidationError)
        expect(repo.replaceAll).not.toHaveBeenCalled()
    })

    it('saves valid injuries through the repository', async () => {
        const repo = fakeRepo()
        const handler = new InjuryHandler(repo)
        const good = [{ bodyPart: 'knee', injuryType: 'chronic' as const, restrictions: ['low_impact'], active: true }]

        await handler.saveInjuries('user-1', good)
        expect(repo.replaceAll).toHaveBeenCalledWith('user-1', good)
    })
})

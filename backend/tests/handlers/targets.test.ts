import { describe, it, expect, vi } from 'vitest'
import type { MacroRepository } from '../../src/data/MacroRepository'
import { ValidationError } from '../../src/errors'
import { calculateAminoAcidTargets, WHO_2007_MG_PER_KG } from '../../src/handlers/aminoAcidTargets'
import { calculateEnergyTargets } from '../../src/handlers/energyTargets'
import { MacroHandler } from '../../src/handlers/MacroHandler'

const person = { age: 30, weightKg: 70, heightCm: 175, sex: 'male', activityLevel: 'moderate', goal: 'maintain' }

describe('calculateEnergyTargets', () => {
    it('calculates reasonable calories for a maintain goal', () => {
        const result = calculateEnergyTargets(person)
        expect(result.calories).toBeGreaterThan(1500)
        expect(result.calories).toBeLessThan(3500)
        expect(result.proteinG).toBeGreaterThan(0)
    })

    it('adjusts calories down for a cut goal vs maintain', () => {
        const maintain = calculateEnergyTargets(person)
        const cut = calculateEnergyTargets({ ...person, goal: 'cut' })
        expect(cut.calories).toBeLessThan(maintain.calories)
    })
})

describe('calculateAminoAcidTargets', () => {
    it('uses the WHO 2007 adult requirements', () => {
        // Table 23 of WHO TRS 935, mg/kg/day. Guards against the old values
        // (methionine alone, threonine 20, tryptophan 6) creeping back.
        expect(WHO_2007_MG_PER_KG).toEqual({
            histidineMg: 10, isoleucineMg: 20, leucineMg: 39, lysineMg: 30,
            methionineCysteineMg: 15, phenylalanineTyrosineMg: 25,
            threonineMg: 15, tryptophanMg: 4, valineMg: 26,
        })
    })

    it('scales by body weight', () => {
        const t = calculateAminoAcidTargets(70)
        expect(t.lysineMg).toBe(2100)
        expect(t.tryptophanMg).toBe(280)
        expect(t.methionineCysteineMg).toBe(1050)
    })
})

describe('MacroHandler.calculateAndSave', () => {
    it('saves energy and amino-acid targets together', async () => {
        const upsert = vi.fn(async () => {})
        const handler = new MacroHandler({ upsert } as unknown as MacroRepository)

        await handler.calculateAndSave('user-1', person)

        expect(upsert).toHaveBeenCalledWith('user-1', {
            ...calculateEnergyTargets(person),
            ...calculateAminoAcidTargets(70),
        })
    })

    it('rejects an impossible weight', async () => {
        const handler = new MacroHandler({ upsert: vi.fn() } as unknown as MacroRepository)
        await expect(handler.calculateAndSave('user-1', { ...person, weightKg: 0 })).rejects.toBeInstanceOf(ValidationError)
    })
})

import { describe, it, expect } from 'vitest'
import { NutritionHandler } from '../../src/handlers/NutritionHandler'

describe('NutritionHandler', () => {
    const service = new NutritionHandler()

    it('flags incomplete coverage for rice alone', async () => {
        const result = await service.checkEAACoverage(['white rice bowl'])
        expect(result.complete).toBe(false)
        expect(result.gaps.length).toBeGreaterThan(0)
    })

    it('detects complementary pairing of rice and beans', async () => {
        const result = await service.checkEAACoverage(['rice and beans bowl'])
        expect(result.complementary_pairs_found.length).toBeGreaterThan(0)
    })

    it('recognizes a complete protein source like quinoa', async () => {
        const result = await service.checkEAACoverage(['quinoa salad'])
        expect(result.complete).toBe(true)
    })
})
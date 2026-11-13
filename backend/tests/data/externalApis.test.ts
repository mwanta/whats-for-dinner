import { describe, it, expect } from 'vitest'
import {RecipeApi} from "../../src/data/external/RecipeApi";
import {UsdaApi} from "../../src/data/external/UsdaApi";


describe('external API integrations', () => {
    it('RecipeApi returns results within 10s', async () => {
        const service = new RecipeApi()
        const results = await service.search({ query: 'dinner' })
        expect(Array.isArray(results)).toBe(true)
    }, 10000)

    it('UsdaApi returns results within 10s', async () => {
        const service = new UsdaApi()
        const results = await service.search('chicken')
        expect(Array.isArray(results)).toBe(true)
    }, 10000)
})
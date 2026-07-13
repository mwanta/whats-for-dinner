const COMPLEMENTARY_PAIRS: Record<string, string[]> = {
    rice: ['beans', 'lentils', 'chickpeas'],
    beans: ['rice', 'corn', 'wheat'],
    lentils: ['rice', 'barley', 'oats'],
    corn: ['beans', 'black beans'],
    hummus: ['pita', 'whole wheat bread'],
    peanut_butter: ['whole wheat bread', 'oats']
}

const INCOMPLETE_PROTEINS = ['rice', 'beans', 'lentils', 'corn', 'nuts', 'seeds', 'oats', 'wheat']
const COMPLETE_PROTEINS = ['quinoa', 'soy', 'tofu', 'tempeh', 'edamame', 'buckwheat', 'hemp']

export class NutritionService {
    async checkEAACoverage(mealNames: string[]) {
        const mealNamesLower = mealNames.map(m => m.toLowerCase())

        const complementaryFound: string[] = []
        for (const [food, partners] of Object.entries(COMPLEMENTARY_PAIRS)) {
            if (mealNamesLower.some(m => m.includes(food))) {
                const matchedPartner = partners.find(p => mealNamesLower.some(m => m.includes(p)))
                if (matchedPartner) complementaryFound.push(`${food} + ${matchedPartner}`)
            }
        }

        const hasIncomplete = mealNamesLower.some(m => INCOMPLETE_PROTEINS.some(p => m.includes(p)))
        const hasComplete = mealNamesLower.some(m => COMPLETE_PROTEINS.some(p => m.includes(p)))

        const gaps: string[] = []
        if (hasIncomplete && !hasComplete && complementaryFound.length === 0) {
            gaps.push('lysine', 'methionine')
        }

        return {
            complete: gaps.length === 0,
            gaps,
            complementary_pairs_found: complementaryFound,
            complete_protein_sources: mealNamesLower.filter(m => COMPLETE_PROTEINS.some(p => m.includes(p))),
            recommendation: gaps.length > 0
                ? `Consider adding a complementary protein source to cover ${gaps.join(', ')}. Good options: quinoa, tofu, tempeh, or pairing rice with beans.`
                : 'Your meal selection provides good amino acid coverage.'
        }
    }
}
// WHO recommended EAA minimums (mg per day for ~70kg adult)
const EAA_MINIMUMS: Record<string, number> = {
    leucine: 2730,
    lysine: 2100,
    methionine: 1050,
    threonine: 1400,
    tryptophan: 420,
    valine: 1820,
    isoleucine: 1400,
    phenylalanine: 1750,
    histidine: 700
}

// Known complementary protein pairings
const COMPLEMENTARY_PAIRS: Record<string, string[]> = {
    rice: ['beans', 'lentils', 'chickpeas'],
    beans: ['rice', 'corn', 'wheat'],
    lentils: ['rice', 'barley', 'oats'],
    corn: ['beans', 'black beans'],
    hummus: ['pita', 'whole wheat bread'],
    peanut_butter: ['whole wheat bread', 'oats']
}

export async function checkEAACoverage(mealNames: string[]) {
    const mealNamesLower = mealNames.map(m => m.toLowerCase())

    // Check for known complementary pairings in the meal list
    const complementaryFound: string[] = []
    for (const [food, partners] of Object.entries(COMPLEMENTARY_PAIRS)) {
        if (mealNamesLower.some(m => m.includes(food))) {
            const matchedPartner = partners.find(p => mealNamesLower.some(m => m.includes(p)))
            if (matchedPartner) {
                complementaryFound.push(`${food} + ${matchedPartner}`)
            }
        }
    }

    // Common incomplete protein sources
    const incompleteProteins = ['rice', 'beans', 'lentils', 'corn', 'nuts', 'seeds', 'oats', 'wheat']
    const completeProteins = ['quinoa', 'soy', 'tofu', 'tempeh', 'edamame', 'buckwheat', 'hemp']

    const hasIncomplete = mealNamesLower.some(m =>
        incompleteProteins.some(p => m.includes(p))
    )
    const hasComplete = mealNamesLower.some(m =>
        completeProteins.some(p => m.includes(p))
    )

    const gaps: string[] = []
    if (hasIncomplete && !hasComplete && complementaryFound.length === 0) {
        gaps.push('lysine')   // most common gap in plant-based diets
        gaps.push('methionine')
    }

    return {
        complete: gaps.length === 0,
        gaps,
        complementary_pairs_found: complementaryFound,
        complete_protein_sources: mealNamesLower.filter(m =>
            completeProteins.some(p => m.includes(p))
        ),
        recommendation: gaps.length > 0
            ? `Consider adding a complementary protein source to cover ${gaps.join(', ')}. Good options: quinoa, tofu, tempeh, or pairing rice with beans.`
            : 'Your meal selection provides good amino acid coverage.'
    }
}
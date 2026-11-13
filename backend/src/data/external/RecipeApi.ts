export type RecipeSearchParams = {
    query?: string
    diet?: string
    intolerances?: string[]
    maxReadyTime?: number
    minProtein?: number
    maxCalories?: number
    cuisine?: string
}

export class RecipeApi {
    private baseUrl = 'https://api.spoonacular.com/recipes'
    private apiKey = process.env.SPOONACULAR_API_KEY

    async search(params: RecipeSearchParams) {
        const searchParams = new URLSearchParams({
            apiKey: this.apiKey!,
            addRecipeNutrition: 'true',
            number: '5',
            ...(params.query && { query: params.query }),
            ...(params.diet && { diet: params.diet }),
            ...(params.intolerances?.length && { intolerances: params.intolerances.join(',') }),
            ...(params.maxReadyTime && { maxReadyTime: String(params.maxReadyTime) }),
            ...(params.minProtein && { minProtein: String(params.minProtein) }),
            ...(params.maxCalories && { maxCalories: String(params.maxCalories) }),
            ...(params.cuisine && { cuisine: params.cuisine })
        })

        const res = await fetch(`${this.baseUrl}/complexSearch?${searchParams}`)
        const data = await res.json()

        if (data.status === 'failure' || !data.results) {
            return []
        }

        return data.results.map((recipe: any) => {
            const nutrients = recipe.nutrition?.nutrients ?? []
            const get = (name: string) =>
                nutrients.find((n: any) => n.name?.toLowerCase() === name.toLowerCase())?.amount ?? 0

            return {
                id: recipe.id,
                name: recipe.title,
                sourceUrl: recipe.sourceUrl,
                image: recipe.image,
                readyInMinutes: recipe.readyInMinutes,
                servings: recipe.servings,
                calories: get('calories'),
                protein_g: get('protein'),
                carbs_g: get('carbohydrates'),
                fat_g: get('fat'),
                fiber_g: get('fiber'),
                diets: recipe.diets ?? [],
                cuisines: recipe.cuisines ?? []
            }
        })
    }

    async getIngredients(recipeId: number) {
        const res = await fetch(
            `${this.baseUrl}/${recipeId}/ingredientWidget.json?apiKey=${this.apiKey}`
        )
        const data = await res.json()
        return (data.ingredients ?? []).map((i: any) => i.name)
    }
}
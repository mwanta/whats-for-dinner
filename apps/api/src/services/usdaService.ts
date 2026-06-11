const USDA_BASE = 'https://api.nal.usda.gov/fdc/v1'
const API_KEY = process.env.USDA_API_KEY

export async function searchUSDA(query: string) {
  const res = await fetch(
    `${USDA_BASE}/foods/search?query=${encodeURIComponent(query)}&pageSize=5&api_key=${API_KEY}`
  )
  const data = await res.json()

  return (data.foods ?? []).map((food: any) => {
    const nutrients = food.foodNutrients ?? []

    const get = (name: string) =>
      nutrients.find((n: any) => n.nutrientName?.toLowerCase().includes(name.toLowerCase()))?.value ?? 0

    return {
      name: food.description,
      fdcId: food.fdcId,
      calories: get('energy'),
      protein_g: get('protein'),
      carbs_g: get('carbohydrate'),
      fat_g: get('total lipid'),
      fiber_g: get('fiber'),
      // Essential amino acids
      leucine_mg: get('leucine'),
      lysine_mg: get('lysine'),
      methionine_mg: get('methionine'),
      threonine_mg: get('threonine'),
      tryptophan_mg: get('tryptophan'),
      valine_mg: get('valine'),
      isoleucine_mg: get('isoleucine'),
      phenylalanine_mg: get('phenylalanine'),
      histidine_mg: get('histidine')
    }
  })
}
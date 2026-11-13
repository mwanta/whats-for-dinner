# ml

Python side of what's-for-dinner: the recipe catalog, and (next) the preference
model and meal-plan optimizer.

## Setup

```sh
cd backend/ml
python3 -m venv .venv
.venv/bin/pip install -e '.[dev]'
```

## Data

Both datasets are public and need no credentials. They go in `data/raw/`
(gitignored).

```sh
mkdir -p data/raw && cd data/raw
# Food.com recipes and reviews (CC0), ~760 MB zipped
curl -L -o foodcom.zip https://www.kaggle.com/api/v1/datasets/download/irkaal/foodcom-recipes-and-reviews
unzip foodcom.zip -d foodcom
# USDA FoodData Central, SR Legacy (amino acids per food)
curl -L -o sr_legacy.zip https://fdc.nal.usda.gov/fdc-datasets/FoodData_Central_sr_legacy_food_csv_2018-04.zip
unzip sr_legacy.zip -d sr_legacy
```

## Build the catalog

```sh
.venv/bin/python -m dinner_ml.data.build_catalog   # ~75 s
.venv/bin/pytest
```

Writes to `data/processed/` (gitignored):

| File | Contents |
|---|---|
| `recipes.parquet` | Clean recipes: per-serving nutrition, total time, ingredients, keywords, and EAA estimates (`<amino acid>_mg`, `eaa_quality`, `protein_coverage`) |
| `interactions.parquet` | One row per (user, recipe): `rating` (NaN for reviews without stars), `timestamp` |
| `ingredient_matches.parquet` | Every distinct ingredient name and the USDA food it matched |

It also regenerates [`reports/ingredient_matching.md`](reports/ingredient_matching.md),
which is checked in so changes to matching show up in diffs.

## How amino acids are estimated

Food.com has reliable per-serving nutrition but no usable ingredient amounts
(quantities are unitless and usually don't line up with the ingredient list).

1. **Match ingredients to USDA** ([`ingredients.py`](dinner_ml/data/ingredients.py)).
   The curated [`ingredient_aliases.csv`](dinner_ml/data/ingredient_aliases.csv) is used first, then
   a token-overlap scorer that penalizes processed or composite foods and
   unrelated lead nouns ("Sugar-apples" for "sugar").
2. **Estimate grams per ingredient** ([`eaa.py`](dinner_ml/data/eaa.py)) with a non-negative least-squares
   fit to the recipe's nine stated nutrients. Cholesterol pins down eggs, carbs
   pin down flour, fiber pins down beans.
3. **Weight each ingredient's amino-acid profile** (mg per g protein) by its
   fitted protein, then scale to the recipe's stated protein.

### Known limits

- Food.com ingredient lists often leave out the main protein ("Easy Oven Pork
  Chops" lists soy sauce and honey). `protein_coverage` (fitted / stated
  protein) catches this; those recipes get `eaa_quality = "low"`.
  **The optimizer should use `eaa_quality == "high"` only.**
- About 1/3 of USDA foods have no amino-acid data; they get their category's
  median profile (`aa_imputed`). In practice that's 0.4% of protein weight.
- Spices are excluded from the fit: they're protein-dense per 100 g but used in
  gram amounts.

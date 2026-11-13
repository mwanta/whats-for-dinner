"""Load and clean the Food.com recipes and reviews (Kaggle: irkaal/foodcom-recipes-and-reviews).

Nutrition columns in the source are per serving. Ingredient quantities are
unitless and, in most recipes, don't line up with the ingredient list, so
they are dropped.
"""
import re
from pathlib import Path

import numpy as np
import pandas as pd

from dinner_ml.paths import FOODCOM_DIR

RECIPE_COLUMNS = {
    "RecipeId": "recipe_id",
    "Name": "name",
    "RecipeCategory": "category",
    "Keywords": "keywords",
    "RecipeIngredientParts": "ingredients",
    "Images": "images",
    "AggregatedRating": "avg_rating",
    "ReviewCount": "review_count",
    "Calories": "calories",
    "FatContent": "fat_g",
    "SaturatedFatContent": "saturated_fat_g",
    "CholesterolContent": "cholesterol_mg",
    "SodiumContent": "sodium_mg",
    "CarbohydrateContent": "carbs_g",
    "FiberContent": "fiber_g",
    "SugarContent": "sugar_g",
    "ProteinContent": "protein_g",
    "RecipeServings": "servings",
    "PrepTime": "prep_time",
    "CookTime": "cook_time",
    "TotalTime": "total_time",
}

# Per-serving sanity bounds. Outside these the source data is almost always
# a whole-batch figure or a typo (max protein in the raw data is 18,396 g).
MIN_CALORIES, MAX_CALORIES = 50, 2500
MAX_PROTEIN_G = 200
# Atwater check: 4P + 4C + 9F should be near the stated calories.
MAX_ATWATER_ERROR = 0.35
MAX_TOTAL_MINUTES = 24 * 60

_DURATION = re.compile(r"^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$")


def iso_minutes(value) -> float:
    """Parse an ISO-8601 duration such as 'PT1H30M' into minutes."""
    if not isinstance(value, str):
        return np.nan
    m = _DURATION.match(value.strip())
    if not m or not any(m.groups()):
        return np.nan
    days, hours, minutes, seconds = (int(g) if g else 0 for g in m.groups())
    return days * 1440 + hours * 60 + minutes + seconds / 60


def _clean_list(values) -> list[str]:
    if values is None or (isinstance(values, float) and np.isnan(values)):
        return []
    return [str(v).strip().lower() for v in values if str(v).strip()]


def load_recipes(foodcom_dir: Path = FOODCOM_DIR) -> tuple[pd.DataFrame, dict[str, int]]:
    """Return (clean recipes, counts of rows dropped by each filter)."""
    raw = pd.read_parquet(foodcom_dir / "recipes.parquet", columns=list(RECIPE_COLUMNS))
    df = raw.rename(columns=RECIPE_COLUMNS)
    df["recipe_id"] = df.recipe_id.astype("int64")
    df["ingredients"] = df.ingredients.map(_clean_list)
    df["keywords"] = df.keywords.map(_clean_list)
    df["image"] = df.images.map(lambda imgs: imgs[0] if imgs is not None and len(imgs) else None)
    for col in ("prep_time", "cook_time", "total_time"):
        df[col.replace("_time", "_minutes")] = df[col].map(iso_minutes)
    df = df.drop(columns=["images", "prep_time", "cook_time", "total_time"])

    atwater = 4 * df.protein_g + 4 * df.carbs_g + 9 * df.fat_g
    atwater_error = (atwater - df.calories).abs() / df.calories.clip(lower=1)

    filters = {
        "no_ingredients": df.ingredients.map(len) == 0,
        "calories_out_of_range": ~df.calories.between(MIN_CALORIES, MAX_CALORIES),
        "protein_out_of_range": df.protein_g > MAX_PROTEIN_G,
        "macros_inconsistent_with_calories": atwater_error > MAX_ATWATER_ERROR,
        "missing_or_extreme_total_time": ~df.total_minutes.between(1, MAX_TOTAL_MINUTES),
    }
    dropped: dict[str, int] = {}
    keep = pd.Series(True, index=df.index)
    for name, bad in filters.items():
        dropped[name] = int((keep & bad).sum())  # counted in order, so no double counting
        keep &= ~bad
    return df[keep].reset_index(drop=True), dropped


def load_interactions(recipe_ids: pd.Series, foodcom_dir: Path = FOODCOM_DIR) -> pd.DataFrame:
    """One row per (user, recipe), keeping the latest review.

    Food.com uses rating 0 for a review without stars. Those still say the
    person cooked the recipe, so they're kept as interactions with rating NaN.
    """
    reviews = pd.read_parquet(
        foodcom_dir / "reviews.parquet", columns=["AuthorId", "RecipeId", "Rating", "DateSubmitted"]
    )
    df = reviews.rename(
        columns={"AuthorId": "user_id", "RecipeId": "recipe_id", "Rating": "rating", "DateSubmitted": "timestamp"}
    )
    df["recipe_id"] = df.recipe_id.astype("int64")
    df = df[df.recipe_id.isin(recipe_ids)]
    df["rating"] = df.rating.where(df.rating > 0).astype("float32")
    df = df.sort_values("timestamp").drop_duplicates(["user_id", "recipe_id"], keep="last")
    return df.reset_index(drop=True)

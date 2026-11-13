"""Load USDA SR Legacy foods with protein and amino-acid profiles.

Amino acids are stored as mg per gram of protein. That is the quantity the
recipe pipeline needs: a recipe's total protein comes from Food.com, and the
ingredients only decide how that protein is split across amino acids.
"""
from pathlib import Path

import pandas as pd

from dinner_ml.paths import SR_LEGACY_DIR

# FDC nutrient id -> column name. Cystine and tyrosine are kept because the WHO
# requirements are for methionine+cystine and phenylalanine+tyrosine combined.
AMINO_ACIDS: dict[int, str] = {
    1221: "histidine",
    1212: "isoleucine",
    1213: "leucine",
    1214: "lysine",
    1215: "methionine",
    1216: "cystine",
    1217: "phenylalanine",
    1218: "tyrosine",
    1211: "threonine",
    1210: "tryptophan",
    1219: "valine",
}
AA_COLUMNS = list(AMINO_ACIDS.values())

# Nutrients that Food.com also reports per serving, used to estimate how many
# grams of each ingredient a recipe contains. Values are per 100 g.
MACRO_NUTRIENTS: dict[int, str] = {
    1008: "kcal",
    1003: "protein_g",
    1004: "fat_g",
    1258: "saturated_fat_g",
    1253: "cholesterol_mg",
    1093: "sodium_mg",
    1005: "carbs_g",
    1079: "fiber_g",
    2000: "sugar_g",
}
MACRO_COLUMNS = list(MACRO_NUTRIENTS.values())

# Categories that are composite dishes or not home-cooking ingredients.
EXCLUDED_CATEGORIES = {
    3,   # Baby Foods
    21,  # Fast Foods
    22,  # Meals, Entrees, and Side Dishes
    24,  # American Indian/Alaska Native Foods
    25,  # Restaurant Foods
    26,  # Branded Food Products Database
    27,  # Quality Control Materials
}

# Below this protein density the amino-acid profile barely affects a recipe,
# so imputing it is harmless.
MIN_PROTEIN_FOR_PROFILE_G = 0.5


def load_usda(sr_dir: Path = SR_LEGACY_DIR) -> pd.DataFrame:
    """Return one row per candidate food, indexed by fdc_id.

    Columns: description, category_id, category, the MACRO_COLUMNS per 100 g
    (missing treated as 0), one column per amino acid in mg per g protein,
    and aa_imputed.
    """
    food = pd.read_csv(sr_dir / "food.csv", usecols=["fdc_id", "description", "food_category_id"])
    categories = pd.read_csv(sr_dir / "food_category.csv").set_index("id")["description"]
    nutrients = pd.read_csv(sr_dir / "food_nutrient.csv", usecols=["fdc_id", "nutrient_id", "amount"])
    nutrients = nutrients[nutrients.nutrient_id.isin([*MACRO_NUTRIENTS, *AMINO_ACIDS])]
    wide = nutrients.pivot_table(index="fdc_id", columns="nutrient_id", values="amount", aggfunc="first")

    df = food.rename(columns={"food_category_id": "category_id"}).set_index("fdc_id")
    df = df[~df.category_id.isin(EXCLUDED_CATEGORIES)]
    df["category"] = df.category_id.map(categories)
    for nid, name in MACRO_NUTRIENTS.items():
        df[name] = wide[nid].reindex(df.index).fillna(0.0)

    for nid, name in AMINO_ACIDS.items():
        grams_per_100g = wide[nid].reindex(df.index) if nid in wide else pd.Series(index=df.index, dtype=float)
        df[name] = grams_per_100g * 1000.0 / df.protein_g.where(df.protein_g >= MIN_PROTEIN_FOR_PROFILE_G)

    return _impute_profiles(df)


def _impute_profiles(df: pd.DataFrame) -> pd.DataFrame:
    """Fill missing amino-acid profiles with the category median, then the global median."""
    has_profile = df[AA_COLUMNS].notna().all(axis=1)
    df["aa_imputed"] = ~has_profile
    reference = df[has_profile]
    category_median = reference.groupby("category_id")[AA_COLUMNS].median()
    global_median = reference[AA_COLUMNS].median()

    filled = category_median.reindex(df.category_id).set_axis(df.index)
    df[AA_COLUMNS] = df[AA_COLUMNS].fillna(filled).fillna(global_median)
    return df

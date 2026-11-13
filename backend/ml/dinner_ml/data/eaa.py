"""Estimate essential amino acids per serving for each recipe.

Food.com gives reliable per-serving nutrition (calories, protein, fat,
saturated fat, cholesterol, sodium, carbs, fiber, sugar) but no usable
ingredient amounts. Those nine numbers constrain the amounts: cholesterol
pins down eggs, carbs pin down flour, fiber pins down beans, and so on.

So for each recipe we solve a small non-negative least-squares problem for
grams of each matched ingredient per serving:

    min_m  || D (A m - b) ||^2 + ridge * ||m||^2,   m >= 0

A holds USDA nutrients per gram, b the recipe's per-serving nutrition, and D
scales each nutrient by its daily value so no single unit dominates.

The fitted grams give each ingredient's protein contribution, which weights
its amino-acid profile (mg per g protein). The result is scaled to the
recipe's stated protein total, which is the most reliable number we have:

    eaa_mg[a] = protein_g * sum_i(protein_share_i * profile_i[a])

If the fit attributes no protein to any ingredient, we fall back to weighting
by protein density alone (an equal-mass assumption). Spices are left out of
both: they're used in tiny amounts but are protein-dense per 100 g.
"""
import numpy as np
import pandas as pd
from scipy.optimize import nnls

from dinner_ml.data.ingredients import Match
from dinner_ml.data.usda import AA_COLUMNS

SPICES_CATEGORY_ID = 2
NEGLIGIBLE_PROTEIN_G = 1.0
# eaa_quality tiers. Two things go wrong: an ingredient doesn't match USDA,
# or Food.com's ingredient list leaves an ingredient out entirely (common for
# the main protein: "Easy Oven Pork Chops" lists soy sauce and honey but no
# pork). Protein coverage (fitted protein / stated protein) catches the
# second. It's only checked from 5 g protein, below that it's noisy and the
# recipe matters little for amino-acid targets.
COVERAGE_CHECK_MIN_PROTEIN_G = 5.0
TIERS = {
    # tier: (min match rate, min protein coverage, max protein coverage)
    "high": (1.0, 0.7, 1.3),
    "medium": (0.8, 0.5, 1.5),
}
EAA_COLUMNS = [f"{aa}_mg" for aa in AA_COLUMNS]

# (recipe column, USDA column, daily value used for scaling)
FIT_NUTRIENTS = [
    ("calories", "kcal", 2000.0),
    ("protein_g", "protein_g", 50.0),
    ("fat_g", "fat_g", 78.0),
    ("saturated_fat_g", "saturated_fat_g", 20.0),
    ("cholesterol_mg", "cholesterol_mg", 300.0),
    ("sodium_mg", "sodium_mg", 2300.0),
    ("carbs_g", "carbs_g", 275.0),
    ("fiber_g", "fiber_g", 28.0),
    ("sugar_g", "sugar_g", 50.0),
]
# Penalty per gram squared. Small: 100 g of an ingredient costs about as much
# as missing one nutrient by 10% of its daily value.
RIDGE = 1e-6


def fit_masses(per_gram: np.ndarray, target: np.ndarray, ridge: float = RIDGE) -> np.ndarray:
    """Grams per serving for each ingredient.

    per_gram: (n_nutrients, k) nutrients per gram, already scaled by daily value.
    target:   (n_nutrients,) per-serving nutrition, scaled the same way.
    """
    k = per_gram.shape[1]
    A = np.vstack([per_gram, np.sqrt(ridge) * np.eye(k)])
    b = np.concatenate([target, np.zeros(k)])
    masses, _ = nnls(A, b, maxiter=50 * k)
    return masses


def quality_tier(out: pd.DataFrame, protein_g: pd.Series) -> pd.Series:
    skip_coverage = protein_g < COVERAGE_CHECK_MIN_PROTEIN_G
    tier = pd.Series("low", index=out.index)
    for name in reversed(list(TIERS)):  # assign medium, then let high overwrite
        min_rate, lo, hi = TIERS[name]
        coverage_ok = skip_coverage | out.protein_coverage.between(lo, hi)
        tier[(out.match_rate >= min_rate) & coverage_ok] = name
    tier[~out.has_eaa] = "none"
    return tier


def recipe_eaa(recipes: pd.DataFrame, matches: dict[str, Match], usda: pd.DataFrame) -> pd.DataFrame:
    """Return per-recipe EAA estimates and quality metrics, indexed by recipe_id."""
    rows = recipes[["recipe_id", "ingredients"]].explode("ingredients").dropna(subset=["ingredients"])
    rows["fdc_id"] = rows.ingredients.map(lambda n: matches[n].fdc_id if matches[n].matched else None)
    rows["matched"] = rows.fdc_id.notna()

    quality = rows.groupby("recipe_id").agg(n_ingredients=("matched", "size"), n_matched=("matched", "sum"))
    quality["match_rate"] = quality.n_matched / quality.n_ingredients

    usable = rows[rows.matched].drop_duplicates(["recipe_id", "fdc_id"])
    usable = usable[usable.fdc_id.map(usda.category_id) != SPICES_CATEGORY_ID]

    # Dense lookup tables so the per-recipe loop only does integer indexing.
    food_ids = usda.index.to_numpy()
    position = pd.Series(np.arange(len(food_ids)), index=food_ids)
    scale = np.array([dv for _, _, dv in FIT_NUTRIENTS])
    per_gram = usda[[u for _, u, _ in FIT_NUTRIENTS]].to_numpy() / 100.0 / scale  # (foods, nutrients)
    protein_per_g = usda.protein_g.to_numpy() / 100.0
    profiles = usda[AA_COLUMNS].to_numpy()
    imputed = usda.aa_imputed.to_numpy()

    recipe_nutrients = recipes.set_index("recipe_id")[[r for r, _, _ in FIT_NUTRIENTS]].fillna(0.0)
    targets = recipe_nutrients.to_numpy() / scale
    target_row = pd.Series(np.arange(len(recipe_nutrients)), index=recipe_nutrients.index)
    protein = recipe_nutrients.protein_g

    groups = usable.groupby("recipe_id").fdc_id.apply(lambda s: position[s.to_numpy()].to_numpy())

    out_ids, out_profiles, methods, imputed_share, kcal_error, protein_cov = [], [], [], [], [], []
    for recipe_id, idx in groups.items():
        target = targets[target_row[recipe_id]]
        masses = fit_masses(per_gram[idx].T, target)
        weights = masses * protein_per_g[idx]
        method = "mass_balance"
        if weights.sum() <= 0:
            weights = protein_per_g[idx].copy()
            method = "equal_mass"
        if weights.sum() <= 0:
            continue
        weights = weights / weights.sum()
        out_ids.append(recipe_id)
        out_profiles.append(weights @ profiles[idx])
        methods.append(method)
        imputed_share.append(float(weights[imputed[idx]].sum()))
        fitted = (per_gram[idx].T @ masses) * scale
        stated = target * scale
        kcal_error.append(abs(fitted[0] - stated[0]) / max(stated[0], 1.0))
        protein_cov.append(fitted[1] / stated[1] if stated[1] > 0 else np.nan)

    profile = pd.DataFrame(np.array(out_profiles).reshape(-1, len(AA_COLUMNS)), index=pd.Index(out_ids, name="recipe_id"), columns=AA_COLUMNS)
    eaa = profile.multiply(protein.reindex(profile.index), axis=0)
    eaa.columns = EAA_COLUMNS

    out = quality.join(eaa, how="left")
    extras = pd.DataFrame(
        {
            "eaa_method": methods,
            "imputed_protein_share": imputed_share,
            "fit_kcal_error": kcal_error,
            "protein_coverage": protein_cov,
        },
        index=profile.index,
    )
    out = out.join(extras, how="left")
    # With almost no protein the profile doesn't matter: the EAA content is ~0.
    negligible = protein.reindex(out.index) < NEGLIGIBLE_PROTEIN_G
    out.loc[negligible, EAA_COLUMNS] = out.loc[negligible, EAA_COLUMNS].fillna(0.0)
    out["has_eaa"] = out[EAA_COLUMNS[0]].notna()
    out["eaa_quality"] = quality_tier(out, protein.reindex(out.index))
    return out

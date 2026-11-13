import numpy as np
import pandas as pd
import pytest

from dinner_ml.data.eaa import EAA_COLUMNS, FIT_NUTRIENTS, fit_masses, recipe_eaa
from dinner_ml.data.ingredients import Match


def recipe(recipe_id, ingredients, usda, grams):
    """A recipe whose per-serving nutrition is exactly what `grams` of each food gives."""
    row = {"recipe_id": recipe_id, "ingredients": [name for name, _ in ingredients]}
    for col, usda_col, _ in FIT_NUTRIENTS:
        row[col] = sum(usda.loc[fdc, usda_col] * g / 100 for (_, fdc), g in zip(ingredients, grams))
    return row


def matches_for(*recipes_ingredients):
    return {name: Match(fdc, "x", 1.0, "alias") for ings in recipes_ingredients for name, fdc in ings}


def test_fit_masses_recovers_exact_amounts():
    rng = np.random.default_rng(0)
    per_gram = rng.uniform(0, 1, size=(9, 3))
    true = np.array([120.0, 40.0, 5.0])
    masses = fit_masses(per_gram, per_gram @ true, ridge=1e-12)
    np.testing.assert_allclose(masses, true, rtol=1e-4)


def test_rice_and_beans_profile_follows_fitted_protein(usda):
    ings = [("rice", 3), ("black beans", 4)]
    grams = [150.0, 100.0]
    recipes = pd.DataFrame([recipe(1, ings, usda, grams)])
    out = recipe_eaa(recipes, matches_for(ings), usda).loc[1]

    rice_protein, bean_protein = 150 * 7.1 / 100, 100 * 21.6 / 100
    total = rice_protein + bean_protein
    expected_lysine = rice_protein * 36 + bean_protein * 69
    assert out.eaa_method == "mass_balance"
    assert out.lysine_mg == pytest.approx(expected_lysine, rel=0.03)
    assert out.lysine_mg / total > 36  # beans lift rice's lysine
    assert out.protein_coverage == pytest.approx(1.0, rel=0.03)
    assert out.eaa_quality == "high"


def test_spices_are_ignored(usda):
    ings = [("black beans", 4), ("cumin", 5)]
    recipes = pd.DataFrame([recipe(1, ings, usda, [100.0, 0.0])])
    out = recipe_eaa(recipes, matches_for(ings), usda).loc[1]
    assert out.lysine_mg / 21.6 == pytest.approx(69.0, rel=0.01)


def test_missing_main_protein_is_flagged(usda):
    # Stated nutrition includes 150 g of beef, but beef isn't in the list.
    full = recipe(1, [("sugar", 1), ("beef", 9)], usda, [10.0, 150.0])
    full["ingredients"] = ["sugar", "cauliflower"]
    recipes = pd.DataFrame([full])
    out = recipe_eaa(recipes, matches_for([("sugar", 1), ("cauliflower", 8)]), usda).loc[1]
    assert out.protein_coverage < 0.5
    assert out.eaa_quality == "low"


def test_negligible_protein_gives_zero_eaa(usda):
    ings = [("sugar", 1)]
    recipes = pd.DataFrame([recipe(1, ings, usda, [50.0])])
    out = recipe_eaa(recipes, matches_for(ings), usda).loc[1]
    assert (out[EAA_COLUMNS] == 0).all()
    assert out.has_eaa

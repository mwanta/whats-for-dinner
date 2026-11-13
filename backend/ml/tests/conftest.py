import pandas as pd
import pytest

from dinner_ml.data.usda import AA_COLUMNS, MACRO_COLUMNS


def make_food(fdc_id, description, category_id=11, protein_g=0.0, aa=None, imputed=False, **macros):
    """One USDA row. aa: mg per g protein, a scalar for every amino acid or a dict."""
    row = {"fdc_id": fdc_id, "description": description, "category_id": category_id, "aa_imputed": imputed}
    row.update({c: 0.0 for c in MACRO_COLUMNS})
    row.update(macros)
    row["protein_g"] = protein_g
    aa = aa if isinstance(aa, dict) else {a: (aa or 0.0) for a in AA_COLUMNS}
    row.update({a: aa.get(a, 0.0) for a in AA_COLUMNS})
    return row


@pytest.fixture
def usda() -> pd.DataFrame:
    rows = [
        make_food(1, "Sugars, granulated", 19, kcal=387, carbs_g=100, sugar_g=100),
        make_food(2, "Sugar-apples, (sweetsop), raw", 9, protein_g=2.1, kcal=94, carbs_g=24),
        make_food(3, "Rice, white, long-grain, regular, raw, enriched", 20, protein_g=7.1,
                  aa={"lysine": 36.0, "methionine": 23.0}, kcal=365, carbs_g=80, fat_g=0.7),
        make_food(4, "Beans, black, mature seeds, raw", 16, protein_g=21.6,
                  aa={"lysine": 69.0, "methionine": 15.0}, kcal=341, carbs_g=62, fat_g=1.4, fiber_g=15.5),
        make_food(5, "Spices, cumin seed", 2, protein_g=17.8, aa=40.0, kcal=375, carbs_g=44, fat_g=22),
        make_food(6, "Beans, white, mature seeds, raw", 16, protein_g=23.4, aa=60.0, kcal=333, carbs_g=60),
        make_food(7, "Lentils, raw", 16, protein_g=24.6, aa=55.0, kcal=352, carbs_g=63, fiber_g=10.7),
        make_food(8, "Cauliflower, raw", 11, protein_g=1.9, aa=30.0, kcal=25, carbs_g=5, fiber_g=2),
        make_food(9, "Beef, ground, 80% lean meat / 20% fat, raw", 13, protein_g=17.2, aa=80.0,
                  kcal=254, fat_g=20, cholesterol_mg=71),
        make_food(10, "Chicken, breaded, fried", 5, protein_g=20.0, aa=80.0, kcal=300),
        make_food(11, "Chicken, broilers or fryers, meat only, raw", 5, protein_g=21.4, aa=85.0, kcal=119),
    ]
    return pd.DataFrame(rows).set_index("fdc_id")

from pathlib import Path

ML_ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = ML_ROOT / "data"
RAW_DIR = DATA_DIR / "raw"
PROCESSED_DIR = DATA_DIR / "processed"

FOODCOM_DIR = RAW_DIR / "foodcom"
SR_LEGACY_DIR = RAW_DIR / "sr_legacy" / "FoodData_Central_sr_legacy_food_csv_2018-04"

# Curated ingredient -> USDA description overrides, checked into git.
ALIASES_CSV = Path(__file__).resolve().parent / "data" / "ingredient_aliases.csv"

"""Match Food.com ingredient names to USDA SR Legacy foods.

Two sources, in priority order:
1. A curated alias table (ingredient_aliases.csv) for common ingredients.
2. A token-overlap scorer. It rewards covering the ingredient's words and
   penalizes extra words, most heavily words that mean a processed or
   composite food ("breaded", "with", "soup"), so "black beans" prefers
   "Beans, black, mature seeds, raw" over a restaurant rice-and-beans entree.
"""
import csv
import re
from dataclasses import dataclass
from pathlib import Path

import pandas as pd

from dinner_ml.paths import ALIASES_CSV

# Words that describe preparation or size and carry no identity.
DESCRIPTORS = {
    "fresh", "freshly", "chopped", "minced", "diced", "sliced", "shredded", "grated",
    "large", "small", "medium", "boneless", "skinless", "extra", "virgin", "kosher",
    "granulated", "unsalted", "softened", "melted", "cold", "warm", "packed", "lean",
    "organic", "of", "a", "the", "to", "taste", "optional", "cup", "cups", "finely",
    "coarsely", "thinly", "crushed", "cubed", "peeled", "seeded", "trimmed", "lightly",
    "beaten", "uncooked", "plain", "pure", "good", "quality", "or", "for", "and", "in",
}

# Extra words in a USDA description that are fine to have.
NEUTRAL = {
    "raw", "fresh", "whole", "regular", "mature", "seed", "commercial", "fluid",
    "boneless", "unenriched", "enriched", "all", "type", "variety", "usda",
    "commodity", "includes", "salted", "unsalted", "solid", "pure", "meat", "only",
}

# Extra words in a USDA description that signal the wrong kind of food.
PROCESSED = {
    "breaded", "fried", "frozen", "canned", "imitation", "mix", "prepared", "with",
    "and", "substitute", "free", "reduced", "low", "lowfat", "nonfat", "sweetened",
    "dehydrated", "flavored", "candy", "candies", "snack", "snacks", "dessert",
    "topping", "spread", "soup", "salad", "dressing", "sandwich", "pie", "cake",
    "cooky", "cracker", "bar", "babyfood", "formula", "condensed", "microwaved",
    "fast", "restaurant", "stuffed", "battered", "glazed", "pudding", "beverage",
    "drink", "cocktail", "syrup", "stick", "nugget", "patty", "infant", "toddler",
}

# Generic USDA lead words ("Spices, cumin seed", "Nuts, pecans") that don't name the food.
CLASS_HEADS = {
    "spice", "nut", "seed", "oil", "sauce", "bean", "beverage", "alcoholic", "mollusk",
    "crustacean", "fish", "sweetener", "syrup", "sugar", "vinegar",
    "leavening", "agent", "cereal", "grain", "product", "fruit", "vegetable",
}

# Trailing words that name a cut or form of the food, safe to drop on retry.
FORM_WORDS = {
    "floret", "fillet", "filet", "half", "piece", "chunk", "cube", "strip", "leaf",
    "sprig", "wedge", "slice", "ring", "stalk", "rib", "head", "kernel", "spear",
    "segment", "round", "tender", "steak", "thigh", "breast", "leg", "wing",
}
SUB_PHRASE_PENALTY = 0.1

PROCESSED_PENALTY = 0.4
# An unrelated lead noun means a different food: "Sugar-apples" for "sugar".
HEAD_PENALTY = 0.35
EXTRA_PENALTY = 0.06
RAW_BONUS = 0.08
MATCH_THRESHOLD = 0.6


def singularize(token: str) -> str:
    if len(token) <= 3 or token.endswith("ss"):
        return token
    if token.endswith("ies"):
        return token[:-3] + "y"
    if token.endswith("oes"):
        return token[:-2]
    if token.endswith("ves"):
        return token[:-3] + "f"
    if token.endswith(("ches", "shes", "sses", "xes")):
        return token[:-2]
    if token.endswith("s") and not token.endswith(("us", "is")):
        return token[:-1]
    return token


def tokenize(text: str) -> list[str]:
    text = re.sub(r"\(.*?\)", " ", text.lower())
    text = re.sub(r"[^a-z0-9%]+", " ", text)
    return [singularize(t) for t in text.split()]


# "tuna packed in water" is tuna, not water.
_PACKING = re.compile(r"\b(?:packed\s+)?in\s+(?:water|oil|olive oil|juice|syrup|light syrup|heavy syrup|brine)\b")


def normalize_ingredient(name: str) -> tuple[str, ...]:
    tokens = [t for t in tokenize(_PACKING.sub(" ", name.lower())) if t not in DESCRIPTORS]
    return tuple(dict.fromkeys(tokens))  # dedupe, keep order


@dataclass(frozen=True)
class Match:
    fdc_id: int | None
    description: str | None
    score: float
    source: str  # "alias", "fuzzy", "partial" (matched on a shorter phrase), or "none"

    @property
    def matched(self) -> bool:
        return self.fdc_id is not None and self.score >= MATCH_THRESHOLD


class IngredientMatcher:
    def __init__(self, usda: pd.DataFrame, aliases_csv: Path = ALIASES_CSV):
        self.usda = usda
        self._tokens: dict[int, frozenset[str]] = {}
        self._heads: dict[int, frozenset[str]] = {}
        self._index: dict[str, set[int]] = {}
        for fdc_id, desc in usda.description.items():
            toks = frozenset(tokenize(desc))
            self._tokens[fdc_id] = toks
            self._heads[fdc_id] = frozenset(tokenize(desc.split(",")[0]))
            for t in toks:
                self._index.setdefault(t, set()).add(fdc_id)
        self._aliases = self._load_aliases(aliases_csv)

    def _load_aliases(self, path: Path) -> dict[tuple[str, ...], int]:
        if not path.exists():
            return {}
        by_description = {d.lower(): i for i, d in self.usda.description.items()}
        aliases: dict[tuple[str, ...], int] = {}
        missing = []
        with open(path, newline="") as f:
            for row in csv.DictReader(f):
                fdc_id = by_description.get(row["usda_description"].strip().lower())
                if fdc_id is None:
                    missing.append(row["usda_description"])
                    continue
                aliases[normalize_ingredient(row["ingredient"])] = fdc_id
        if missing:
            raise ValueError(f"Aliases point at USDA descriptions that don't exist: {missing}")
        return aliases

    def score(self, ingredient: tuple[str, ...], fdc_id: int) -> float:
        wanted = set(ingredient)
        have = self._tokens[fdc_id]
        if not wanted:
            return 0.0
        recall = len(wanted & have) / len(wanted)
        extras = have - wanted - NEUTRAL
        processed = len(extras & PROCESSED)
        other = len(extras) - processed
        foreign_head = len(self._heads[fdc_id] - wanted - CLASS_HEADS - NEUTRAL)
        bonus = RAW_BONUS if "raw" in have else 0.0
        return (
            recall
            - PROCESSED_PENALTY * processed
            - EXTRA_PENALTY * other
            - HEAD_PENALTY * foreign_head
            + bonus
        )

    def match(self, name: str) -> Match:
        tokens = normalize_ingredient(name)
        best = self._match_tokens(tokens)
        if best.matched:
            return best
        # Retry on shorter phrases: drop leading modifiers ("dried lentils" ->
        # "lentils") or a trailing form word ("cauliflower florets" ->
        # "cauliflower"). Other trailing words are never dropped, so
        # "beef bouillon" can't become "beef".
        for shorter, dropped in _sub_phrases(tokens):
            m = self._match_tokens(shorter)
            m = Match(m.fdc_id, m.description, round(m.score - SUB_PHRASE_PENALTY * dropped, 3), "partial")
            if m.matched and m.score > best.score:
                best = m
        return best

    def _match_tokens(self, tokens: tuple[str, ...]) -> Match:
        if tokens in self._aliases:
            fdc_id = self._aliases[tokens]
            return Match(fdc_id, self.usda.description[fdc_id], 1.0, "alias")
        candidates = set().union(*(self._index.get(t, set()) for t in tokens)) if tokens else set()
        if not candidates:
            return Match(None, None, 0.0, "none")
        # Tie-break on the shorter description, which is usually the generic form.
        best = max(candidates, key=lambda i: (self.score(tokens, i), -len(self._tokens[i])))
        return Match(best, self.usda.description[best], round(self.score(tokens, best), 3), "fuzzy")


def _sub_phrases(tokens: tuple[str, ...]):
    """Yield (shorter phrase, tokens dropped), fewest dropped first."""
    seen = set()
    n = len(tokens)
    for start in range(n):
        end = n
        while end > start:
            if (start, end) != (0, n) and (start, end) not in seen:
                seen.add((start, end))
                yield tokens[start:end], n - (end - start)
            if tokens[end - 1] not in FORM_WORDS:
                break
            end -= 1

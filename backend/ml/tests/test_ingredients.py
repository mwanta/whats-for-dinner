import pytest

from dinner_ml.data.ingredients import IngredientMatcher, normalize_ingredient, singularize


@pytest.fixture
def matcher(usda, tmp_path):
    aliases = tmp_path / "aliases.csv"
    aliases.write_text('ingredient,usda_description\nwhite sugar,"Sugars, granulated"\n')
    return IngredientMatcher(usda, aliases_csv=aliases)


@pytest.mark.parametrize(
    "word,expected",
    [("tomatoes", "tomato"), ("berries", "berry"), ("leaves", "leaf"), ("peaches", "peach"),
     ("eggs", "egg"), ("glass", "glass"), ("asparagus", "asparagus"), ("pea", "pea")],
)
def test_singularize(word, expected):
    assert singularize(word) == expected


def test_normalize_drops_descriptors_and_packing():
    assert normalize_ingredient("2 Large Fresh Tomatoes (chopped)") == ("2", "tomato")
    assert normalize_ingredient("tuna packed in water") == ("tuna",)
    assert normalize_ingredient("boneless skinless chicken breasts") == ("chicken", "breast")


def test_alias_wins(matcher):
    m = matcher.match("White Sugar")
    assert (m.fdc_id, m.source) == (1, "alias")


def test_unrelated_head_noun_is_penalized(matcher):
    # "Sugar-apples" contains "sugar" but is a fruit.
    assert matcher.match("sugar").fdc_id == 1


def test_processed_forms_lose_to_plain(matcher):
    assert matcher.match("chicken").fdc_id == 11


def test_partial_match_drops_leading_modifier(matcher):
    m = matcher.match("dried lentils")
    assert (m.fdc_id, m.source) == (7, "partial")


def test_partial_match_drops_trailing_form_word(matcher):
    assert matcher.match("cauliflower florets").fdc_id == 8


def test_partial_match_never_drops_other_trailing_words(matcher):
    # Would be a protein error: bouillon is not beef.
    assert not matcher.match("beef bouillon").matched


def test_missing_alias_target_raises(usda, tmp_path):
    bad = tmp_path / "aliases.csv"
    bad.write_text('ingredient,usda_description\nfoo,"Not a real food"\n')
    with pytest.raises(ValueError, match="Not a real food"):
        IngredientMatcher(usda, aliases_csv=bad)

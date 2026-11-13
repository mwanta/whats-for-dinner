import math

import pytest

from dinner_ml.data.foodcom import iso_minutes


@pytest.mark.parametrize(
    "value,expected",
    [("PT45M", 45), ("PT24H45M", 1485), ("PT1H", 60), ("P1DT2H", 1560), ("PT30S", 0.5)],
)
def test_iso_minutes(value, expected):
    assert iso_minutes(value) == expected


@pytest.mark.parametrize("value", [None, "", "PT", "45 minutes", float("nan")])
def test_iso_minutes_invalid(value):
    assert math.isnan(iso_minutes(value))

# test_logic.py
from backend.logic import calculate_weighted_sum

def test_calculate_weighted_sum():
    weights = {1: 2.0, 2: 4.0}
    ratings = [
        {"alternative_id": 10, "criterion_id": 1, "value": 9.0},
        {"alternative_id": 10, "criterion_id": 2, "value": 4.0},
    ]
    result = calculate_weighted_sum(weights, ratings)
    assert result == {10: 34.0}

def test_calculate_weighted_sum_missing_weight():
    weights = {1: 2.0}
    ratings = [{"alternative_id": 10, "criterion_id": 99, "value": 5.0}]
    result = calculate_weighted_sum(weights, ratings)
    assert result == {10: 0.0}  # weight defaults to 0
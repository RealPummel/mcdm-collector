from typing import Dict, List

def calculate_weighted_sum(weights: Dict[int, float], 
                           ratings: List[Dict[int, any]]
                           ) -> Dict[int, float]:
    
    scores: Dict[int, float] = {}
    
    for rating in ratings:
        alt_id = rating["alternative_id"]
        crit_id = rating["criterion_id"]
        val = rating["value"]
        
        weight = weights.get(crit_id, 0.0)
    
        weighted_val = val * weight
    
        if alt_id not in scores:
            scores[alt_id] = 0.0
    
        scores[alt_id] += weighted_val
    
    return scores

def calculate_average_alt_score(ratings: List[float]) -> float:
    if not ratings:
        return 0.0
    
    return sum(ratings) / len(ratings)
        

    
def calculate_average_weight(weights: List[Dict[int, float]]) -> Dict[int, float]:
    
    sum_weights: Dict[int, float] = {}
    
    for user_weight_dict in weights:
        for criterion_id, weight_val in user_weight_dict.items():
            if criterion_id not in sum_weights:
                sum_weights[criterion_id] = 0.0
            
            sum_weights[criterion_id] += weight_val
    
    num_users = len(weights)
    
    if num_users == 0:
        return {}
    
    average_weights: Dict[int, float] = {
        criterion_id: round(total_sum / num_users, 2)
        for criterion_id, total_sum in sum_weights.items()
    }
    
    return average_weights
        

def test_with_json():
    input_json = {
        "user_id": "12345",
        "preferences": [
            {"criterion_id": 1, "weight": 2.0},
            {"criterion_id": 2, "weight": 4.0}
        ],
        "ratings": [
            {"alternative_id": 10, "criterion_id": 1, "value": 9.0},
            {"alternative_id": 10, "criterion_id": 2, "value": 4.0},
            {"alternative_id": 12, "criterion_id": 1, "value": 5.0},
            {"alternative_id": 12, "criterion_id": 2, "value": 8.0}
        ]
    }
    
    formatted_weights: Dict[int, float] = {
        p["criterion_id"]: p["weight"] for p in input_json["preferences"]
    }
    
    ratings_list = input_json["ratings"]
    result_weighted_sum = calculate_weighted_sum(formatted_weights, ratings_list)
    
    print("Scores for alternatives:")
    print(result_weighted_sum)
    
    mock_weights_from_multiple_users = [
        {1: 2.0, 2: 4.0},  # User 1
        {1: 4.0, 2: 2.0},  # User 2
        {1: 3.0, 2: 3.0}   # User 3
    ]
    
    result_average = calculate_average_weight(mock_weights_from_multiple_users)
    
    print(result_average)
        
test_with_json()
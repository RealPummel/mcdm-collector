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
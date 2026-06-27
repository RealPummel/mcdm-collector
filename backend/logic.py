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

def calculate_score_range(weights: Dict[int, dict], # {criterion_id: {"min": x, "max": y}}
                          ratings: Dict[int, dict]  # {alternative_id: {criterion_id: {"min": x, "max": y}}}
) -> Dict:
    results = {}
    
    for alt_id, criteria in ratings.items():
        
        # Calculate min and max possible scores
        min_score = sum(
            weights[int(crit_id)]["min"] * bounds["min"]
            for crit_id, bounds in criteria.items()
            if int(crit_id) in weights
        )
        
        max_score = sum(
            weights[int(crit_id)]["max"] * bounds["max"]
            for crit_id, bounds in criteria.items()
            if int(crit_id) in weights
        )
        
        current_span = max_score - min_score
        
        # Calculate the reduction of the span if decision makers agree on criteria (via average value)
        
        criterion_impact = {}
        for crit_id, bounds in criteria.items():
            crit_id_int = int(crit_id)
            if crit_id_int not in weights:
                continue
            
            w = weights[crit_id_int]
            avg_weight = (w["min"] + w["max"]) / 2
            avg_rating = (bounds["min"] + bounds["max"]) / 2
            
            # Calculate new span if one criteria is set to average
            
            new_min = avg_weight * avg_rating + sum(
                weights[int(crit)]["min"] * bound["min"]
                for crit, bound in criteria.items()
                if int(crit) != crit_id_int and int(crit) in weights
            )
            
            new_max = avg_weight * avg_rating + sum(
                weights[int(crit)]["max"] * bound["max"]
                for crit, bound in criteria.items()
                if int(crit) != crit_id_int and int(crit) in weights
            )
            
            new_span = new_max - new_min
            
            reduction = current_span - new_span
            
            criterion_impact[crit_id_int] = {
                "span_before": current_span,
                "span_after": new_span,
                "reduction": reduction
            }
        
        sorted_impact = dict(sorted(criterion_impact.items(), key=lambda x: x[1]["reduction"], reverse=True))
        
        results[alt_id] = {
            "min_score": min_score,
            "max_score": max_score,
            "span": current_span,
            "criterion_impact": sorted_impact
        }
        
    return results
POLICY_RULES = {
    "POLICY-001": {
        "ndvi_drop_threshold": 30.0,
        "rain_anomaly_threshold": 40.0,
        "yield_loss_threshold": 25.0,
        "name": "Standard Drought Protection",
        "coverage_multiplier": 1.0
    },
    "POLICY-002": {
        "ndvi_drop_threshold": 20.0,
        "rain_anomaly_threshold": 30.0,
        "yield_loss_threshold": 15.0,
        "name": "Premium Crop Protection",
        "coverage_multiplier": 1.5
    },
    "POLICY-003": {
        "ndvi_drop_threshold": 25.0,
        "rain_anomaly_threshold": 50.0,
        "yield_loss_threshold": 20.0,
        "name": "Flood Protection",
        "coverage_multiplier": 1.2
    }
}

class InsuranceRulesEngine:
    def evaluate(
        self,
        policy_id: str,
        ndvi_drop_pct: float,
        rain_anomaly_abs_pct: float,
        yield_loss_pct: float
    ) -> dict:
        
        rule = POLICY_RULES.get(policy_id, POLICY_RULES["POLICY-001"])
        
        cond_ndvi = ndvi_drop_pct >= rule["ndvi_drop_threshold"]
        cond_rain = rain_anomaly_abs_pct >= rule["rain_anomaly_threshold"]
        cond_yield = yield_loss_pct >= rule["yield_loss_threshold"]
        
        # Need at least two conditions to be true
        eligible = sum([cond_ndvi, cond_rain, cond_yield]) >= 2
        
        return {
            "eligible": eligible,
            "policy_id": policy_id,
            "conditions_met": {
                "ndvi_drop": cond_ndvi,
                "rain_anomaly": cond_rain,
                "yield_loss": cond_yield
            },
            "ndvi_drop_scaled": int(ndvi_drop_pct * 100),
            "rain_anomaly_scaled": int(rain_anomaly_abs_pct * 100),
            "yield_loss_scaled": int(yield_loss_pct * 100),
            "thresholds_scaled": {
                "ndvi_drop": int(rule["ndvi_drop_threshold"] * 100),
                "rain_anomaly": int(rule["rain_anomaly_threshold"] * 100),
                "yield_loss": int(rule["yield_loss_threshold"] * 100)
            }
        }

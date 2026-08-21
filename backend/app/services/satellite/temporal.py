from app.services.satellite.indices import compute_all_indices, mean_index

class TemporalAnalyzer:
    def compute_ndvi_timeseries(self, observations: list[dict]) -> list[dict]:
        timeseries = []
        for obs in observations:
            indices = compute_all_indices(obs["bands"])
            ndvi_mean = mean_index(indices["ndvi"])
            evi_mean = mean_index(indices["evi"])
            timeseries.append({
                "date": obs["date"],
                "ndvi": ndvi_mean,
                "evi": evi_mean,
                "cloud_cover": obs.get("cloud_cover", 0.0)
            })
        return timeseries
    
    def detect_ndvi_drop(self, timeseries: list[dict], lookback_days: int = 30) -> dict:
        if not timeseries:
            return {"baseline_ndvi": 0.0, "current_ndvi": 0.0, "drop_pct": 0.0, "drop_scaled": 0}
            
        current_ndvi = timeseries[-1]["ndvi"]
        
        # Simple baseline: max NDVI in the series
        baseline_ndvi = max([obs["ndvi"] for obs in timeseries])
        
        if baseline_ndvi > 0:
            drop_pct = ((baseline_ndvi - current_ndvi) / baseline_ndvi) * 100
            drop_pct = max(0, drop_pct)
        else:
            drop_pct = 0.0
            
        return {
            "baseline_ndvi": baseline_ndvi,
            "current_ndvi": current_ndvi,
            "drop_pct": drop_pct,
            "drop_scaled": int(drop_pct * 100)
        }
    
    def compute_crop_health_score(self, timeseries: list[dict]) -> float:
        drop_data = self.detect_ndvi_drop(timeseries)
        drop_pct = drop_data["drop_pct"]
        health = max(0.0, 1.0 - (drop_pct / 100.0))
        return health
    
    def detect_stress_anomalies(self, timeseries: list[dict]) -> dict:
        return {
            "stress_events": [],
            "max_stress_duration_days": 0
        }

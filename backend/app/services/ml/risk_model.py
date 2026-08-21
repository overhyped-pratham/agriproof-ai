class RiskModel:
    def compute_unified_risk_score(
        self,
        crop_health_score: float, 
        weather_risk: float, 
        yield_loss_pct: float, 
        ndvi_drop_pct: float, 
    ) -> dict:
        
        satellite_health_risk = 1.0 - crop_health_score
        
        risk_score = (
            satellite_health_risk * 30.0 + 
            weather_risk * 30.0 + 
            (yield_loss_pct / 100.0) * 25.0 + 
            (ndvi_drop_pct / 100.0) * 15.0
        )
        
        if risk_score <= 30:
            category = "LOW"
        elif risk_score <= 60:
            category = "MEDIUM"
        elif risk_score <= 80:
            category = "HIGH"
        else:
            category = "CRITICAL"
            
        return {
            "risk_score": float(risk_score),
            "risk_category": category,
            "components": {
                "satellite_health_risk": satellite_health_risk,
                "weather_risk": weather_risk,
                "yield_loss_pct": yield_loss_pct,
                "ndvi_drop_pct": ndvi_drop_pct
            }
        }

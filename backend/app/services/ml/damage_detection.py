import joblib
import pandas as pd
from pathlib import Path
from app.services.ml.train import train_models

class DamageDetector:
    def __init__(self):
        self.model = None
        self.model_path = Path(__file__).parent.parent.parent.parent.parent / "models" / "damage_classifier.pkl"
        
    def load(self) -> None:
        if not self.model_path.exists():
            train_models()
        self.model = joblib.load(self.model_path)
    
    def classify_stress(self, features: dict) -> dict:
        if self.model is None:
            self.load()
            
        df = pd.DataFrame([features])
        required_features = [
            'ndvi_current', 'ndvi_baseline', 'ndvi_drop_pct', 'evi', 'ndwi',
            'rainfall_mm', 'rainfall_anomaly_pct', 'temp_mean', 'humidity',
            'crop_type_encoded', 'days_since_sowing', 'area_hectares'
        ]
        
        for f in required_features:
            if f not in df.columns:
                df[f] = 0.0
                
        df = df[required_features]
        pred_class = int(self.model.predict(df)[0])
        probas = self.model.predict_proba(df)[0]
        
        mapping = {0: "LOW", 1: "MEDIUM", 2: "HIGH", 3: "CRITICAL"}
        stress_level = mapping.get(pred_class, "UNKNOWN")
        damage_prob = float(probas[pred_class])
        
        return {
            "stress_level": stress_level,
            "damage_probability": damage_prob,
            "confidence": float(max(probas))
        }

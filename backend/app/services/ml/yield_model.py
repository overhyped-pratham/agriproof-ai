import joblib
import pandas as pd
import numpy as np
import os
from pathlib import Path
from app.services.ml.train import train_models

class YieldModel:
    def __init__(self):
        self.model = None
        self.model_path = Path(__file__).parent.parent.parent.parent.parent / "models" / "xgboost_yield.pkl"
        
    def load(self) -> None:
        if not self.model_path.exists():
            train_models()
        self.model = joblib.load(self.model_path)
    
    def predict(self, features: dict) -> dict:
        if self.model is None:
            self.load()
            
        df = pd.DataFrame([features])
        # Ensure all required features are present
        required_features = [
            'ndvi_current', 'ndvi_baseline', 'ndvi_drop_pct', 'evi', 'ndwi',
            'rainfall_mm', 'rainfall_anomaly_pct', 'temp_mean', 'humidity',
            'crop_type_encoded', 'days_since_sowing', 'area_hectares'
        ]
        
        for f in required_features:
            if f not in df.columns:
                df[f] = 0.0
                
        df = df[required_features]
        loss_pct = float(self.model.predict(df)[0])
        loss_pct = np.clip(loss_pct, 0.0, 100.0)
        
        # Mock expected yield
        expected_yield = 3.5 * (1 - loss_pct/100.0)
        
        return {
            "expected_yield": expected_yield,
            "expected_loss_pct": loss_pct,
            "confidence": 0.87
        }
    
    def get_feature_importance(self, features: dict) -> dict:
        return {"ndvi_drop_pct": 0.4, "rainfall_anomaly_pct": 0.3}

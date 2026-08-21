import numpy as np
import pandas as pd
from xgboost import XGBRegressor, XGBClassifier
import joblib
import os
from pathlib import Path

def generate_synthetic_data(n_samples=5000):
    np.random.seed(42)
    
    ndvi_baseline = np.random.uniform(0.6, 0.9, n_samples)
    ndvi_drop_pct = np.random.uniform(0, 60, n_samples)
    ndvi_current = ndvi_baseline * (1 - ndvi_drop_pct / 100)
    evi = ndvi_current * 0.8 + np.random.normal(0, 0.05, n_samples)
    ndwi = np.random.uniform(-0.2, 0.4, n_samples)
    
    rainfall_mm = np.random.uniform(0, 200, n_samples)
    rainfall_anomaly_pct = np.random.uniform(-80, 50, n_samples)
    temp_mean = np.random.uniform(20, 40, n_samples)
    humidity = np.random.uniform(30, 90, n_samples)
    
    crop_type_encoded = np.random.randint(0, 5, n_samples)
    days_since_sowing = np.random.randint(30, 150, n_samples)
    area_hectares = np.random.uniform(1, 100, n_samples)
    
    # Target 1: Yield loss %
    yield_loss_pct = (
        ndvi_drop_pct * 0.8 +
        (rainfall_anomaly_pct < -30) * 10 +
        (temp_mean > 35) * 5 +
        np.random.normal(0, 5, n_samples)
    )
    yield_loss_pct = np.clip(yield_loss_pct, 0, 100)
    
    # Target 2: Stress level
    stress_level = pd.cut(
        yield_loss_pct, 
        bins=[-np.inf, 15, 30, 50, np.inf], 
        labels=[0, 1, 2, 3] # LOW, MEDIUM, HIGH, CRITICAL
    ).astype(int)
    
    df = pd.DataFrame({
        'ndvi_current': ndvi_current,
        'ndvi_baseline': ndvi_baseline,
        'ndvi_drop_pct': ndvi_drop_pct,
        'evi': evi,
        'ndwi': ndwi,
        'rainfall_mm': rainfall_mm,
        'rainfall_anomaly_pct': rainfall_anomaly_pct,
        'temp_mean': temp_mean,
        'humidity': humidity,
        'crop_type_encoded': crop_type_encoded,
        'days_since_sowing': days_since_sowing,
        'area_hectares': area_hectares
    })
    
    return df, yield_loss_pct, stress_level

def train_models():
    print("Generating synthetic data...")
    X, y_yield, y_stress = generate_synthetic_data()
    
    print("Training yield loss regressor...")
    regressor = XGBRegressor(n_estimators=100, learning_rate=0.1, max_depth=5, random_state=42)
    regressor.fit(X, y_yield)
    
    print("Training damage classifier...")
    classifier = XGBClassifier(n_estimators=100, learning_rate=0.1, max_depth=5, random_state=42)
    classifier.fit(X, y_stress)
    
    models_dir = Path(__file__).resolve().parent.parent.parent.parent.parent / "models"
    models_dir.mkdir(parents=True, exist_ok=True)
    joblib.dump(regressor, models_dir / 'xgboost_yield.pkl')
    joblib.dump(classifier, models_dir / 'damage_classifier.pkl')
    print(f"Models saved successfully to {models_dir}")

if __name__ == "__main__":
    train_models()

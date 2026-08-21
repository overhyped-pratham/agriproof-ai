import uuid
from datetime import datetime
from sqlalchemy import Column, String, Float, DateTime, Integer, Boolean, ForeignKey, JSON
from app.database import Base

class Claim(Base):
    __tablename__ = "claims"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    farm_id = Column(String(36), ForeignKey("farms.id"), nullable=False)
    claim_id = Column(String, unique=True, nullable=False)
    satellite_evidence_hash = Column(String, nullable=False)
    prediction_hash = Column(String, nullable=False)
    zk_proof = Column(JSON, nullable=False)
    zk_proof_hash = Column(String, nullable=False)
    eligible = Column(Boolean, nullable=False)
    ndvi_drop_scaled = Column(Integer, nullable=False)
    rain_anomaly_scaled = Column(Integer, nullable=False)
    yield_loss_scaled = Column(Integer, nullable=False)
    block_hash = Column(String, nullable=False)
    previous_block_hash = Column(String, nullable=False)
    block_index = Column(Integer, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    verified_at = Column(DateTime, nullable=True)

class AnalysisResult(Base):
    __tablename__ = "analysis_results"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    farm_id = Column(String(36), ForeignKey("farms.id"), nullable=False)
    crop_health_score = Column(Float, nullable=False)
    damage_probability = Column(Float, nullable=False)
    stress_level = Column(String, nullable=False)
    ndvi_current = Column(Float, nullable=False)
    ndvi_baseline = Column(Float, nullable=False)
    ndvi_drop_pct = Column(Float, nullable=False)
    evi_current = Column(Float, nullable=False)
    ndwi_current = Column(Float, nullable=False)
    ndmi_current = Column(Float, nullable=False)
    rainfall_mm_30d = Column(Float, nullable=False)
    rainfall_anomaly_pct = Column(Float, nullable=False)
    temperature_mean = Column(Float, nullable=False)
    heat_stress_score = Column(Float, nullable=False)
    drought_risk = Column(Float, nullable=False)
    flood_risk = Column(Float, nullable=False)
    overall_environmental_risk = Column(String, nullable=False)
    expected_yield = Column(Float, nullable=False)
    expected_loss_pct = Column(Float, nullable=False)
    confidence = Column(Float, nullable=False)
    risk_score = Column(Float, nullable=False)
    risk_category = Column(String, nullable=False)
    ndvi_time_series = Column(JSON, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

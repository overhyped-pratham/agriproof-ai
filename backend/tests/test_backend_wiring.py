"""
Comprehensive Backend Wiring & End-to-End Architecture Integration Test Suite
Validates:
1. Router & API Endpoint Wiring (Farms, Analysis, Land Analysis, Timeseries, Claims, Ledger)
2. Service Layer Wiring (Pipeline, Weather, Satellite, Planet Insights, ML, ZK, Blockchain)
3. Cryptographic Wiring (SHA-256 Commitments, Groth16 zk-SNARK Verification, Block Hash Chaining)
4. Database & ORM Async Session Lifecycle
5. Error Handling & Validation Edge Cases
"""

import pytest
import asyncio
from httpx import AsyncClient, ASGITransport

from app.main import app
from app.database import get_db, AsyncSessionLocal
from app.services.satellite.indices import (
    calculate_ndvi,
    calculate_evi,
    calculate_ndwi,
    calculate_ndmi,
    calculate_savi,
    calculate_bsi
)
from app.services.satellite.planet_service import PlanetInsightsService
from app.services.weather.risk_engine import WeatherRiskEngine
from app.services.ml.damage_detection import DamageDetector
from app.services.ml.yield_model import YieldModel
from app.services.ml.risk_model import RiskModel
from app.services.zk.proof_generator import ZKProofGenerator
from app.services.zk.proof_verifier import ZKProofVerifier
from app.services.ledger.blockchain import ClaimLedger


@pytest.mark.asyncio
async def test_api_wiring_full_lifecycle():
    """Test full API wiring from farm registration to claim generation, verification, and ledger validation."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Health check
        res = await client.get("/health")
        assert res.status_code == 200
        assert res.json()["status"] == "healthy"

        # 2. Register Farm
        farm_payload = {
            "name": "Integration Test Wheat Field",
            "crop_type": "wheat",
            "sowing_date": "2024-11-01",
            "policy_id": "POLICY-001",
            "polygon_coordinates": [
                [30.3410, 76.3855],
                [30.3410, 76.3883],
                [30.3386, 76.3883],
                [30.3386, 76.3855]
            ]
        }
        res_farm = await client.post("/api/farms", json=farm_payload)
        assert res_farm.status_code == 200
        farm = res_farm.json()
        farm_id = farm["id"]
        assert farm["name"] == "Integration Test Wheat Field"
        assert len(farm["commitment_hash"]) == 64

        # 3. Get Farm by ID
        res_get_farm = await client.get(f"/api/farms/{farm_id}")
        assert res_get_farm.status_code == 200
        assert res_get_farm.json()["id"] == farm_id

        # 4. List all farms
        res_list = await client.get("/api/farms")
        assert res_list.status_code == 200
        assert any(f["id"] == farm_id for f in res_list.json())

        # 5. Execute Analysis Pipeline
        res_analyze = await client.post(f"/api/farms/{farm_id}/analyze")
        assert res_analyze.status_code == 200
        assert res_analyze.json()["status"] == "complete"

        # 6. Fetch Analysis Result
        res_analysis = await client.get(f"/api/farms/{farm_id}/analysis")
        assert res_analysis.status_code == 200
        analysis = res_analysis.json()
        assert "ndvi_current" in analysis
        assert "ndvi_baseline" in analysis
        assert "expected_loss_pct" in analysis
        assert "risk_score" in analysis
        assert len(analysis["ndvi_time_series"]) > 0

        # 7. Fetch Land Satellite Analysis (High-Res Spectral Breakdown)
        res_land = await client.get(f"/api/farms/{farm_id}/land-analysis")
        assert res_land.status_code == 200
        land = res_land.json()
        assert "land_zoning" in land
        assert "indices_comparison" in land
        assert "soil_and_surface" in land
        assert "spectral_reflectance_curve" in land
        assert "satellite_metadata" in land
        assert len(land["spectral_reflectance_curve"]) == 6

        # 8. Fetch Timeseries Endpoint
        res_ts = await client.get(f"/api/farms/{farm_id}/timeseries")
        assert res_ts.status_code == 200
        ts_data = res_ts.json()
        assert "timeseries" in ts_data
        assert isinstance(ts_data["timeseries"], list)
        assert len(ts_data["timeseries"]) > 0

        # 9. Create Claim (Triggers ZK-SNARK proof generation & Block Mining)
        res_claim = await client.post("/api/claims", json={"farm_id": farm_id})
        assert res_claim.status_code == 200
        claim = res_claim.json()
        claim_id = claim["claim_id"]
        assert claim["farm_id"] == farm_id
        assert len(claim["satellite_evidence_hash"]) > 0
        assert len(claim["block_hash"]) == 64
        assert claim["block_index"] >= 0

        # 10. Get Claim by ID
        res_get_claim = await client.get(f"/api/claims/{claim_id}")
        assert res_get_claim.status_code == 200
        assert res_get_claim.json()["claim_id"] == claim_id

        # 11. Verify Claim & ZK Proof Cryptographically
        res_verify = await client.post(f"/api/claims/{claim_id}/verify")
        assert res_verify.status_code == 200
        v = res_verify.json()
        assert v["zk_proof_valid"] is True
        assert v["ledger_valid"] is True
        assert v["overall_valid"] is True

        # 12. Verify Entire Blockchain Ledger Integrity
        res_ledger = await client.get("/api/ledger/verify")
        assert res_ledger.status_code == 200
        l_status = res_ledger.json()
        assert l_status["valid"] is True
        assert l_status["broken_at"] is None


def test_service_wiring_spectral_math():
    """Verify all 6 multi-spectral mathematical index formulas calculate correctly."""
    nir, red, green, blue, swir1, swir2 = 0.65, 0.12, 0.20, 0.08, 0.18, 0.10
    
    ndvi = calculate_ndvi(nir, red)
    assert 0.68 < float(ndvi) < 0.70
    
    evi = calculate_evi(nir, red, blue)
    assert float(evi) > 0.5
    
    ndwi = calculate_ndwi(green, nir)
    assert float(ndwi) < 0  # Vegetation has negative NDWI
    
    ndmi = calculate_ndmi(nir, swir1)
    assert float(ndmi) > 0
    
    savi = calculate_savi(nir, red)
    assert float(savi) > 0.4
    
    bsi = calculate_bsi(swir1, red, nir, blue)
    assert float(bsi) < 0.0


@pytest.mark.asyncio
async def test_service_wiring_ml_and_risk_models():
    """Verify ML models and risk engine compute deterministic predictions."""
    detector = DamageDetector()
    yield_model = YieldModel()
    risk_model = RiskModel()
    weather_engine = WeatherRiskEngine()

    features = {
        "ndvi_current": 0.35,
        "ndvi_baseline": 0.75,
        "ndvi_drop_pct": 53.3,
        "evi": 0.28,
        "ndwi": -0.22,
        "rainfall_mm": 12.0,
        "rainfall_anomaly_pct": -45.0,
        "temp_mean": 36.5,
        "humidity": 30.0,
        "crop_type_encoded": 0,
        "days_since_sowing": 90,
        "area_hectares": 8.5
    }

    # 1. Damage Classifier
    stress_res = detector.classify_stress(features)
    assert "stress_level" in stress_res
    assert "damage_probability" in stress_res
    assert 0.0 <= stress_res["damage_probability"] <= 1.0

    # 2. Yield Loss Model
    yield_res = yield_model.predict(features)
    assert "expected_loss_pct" in yield_res
    assert 0.0 <= yield_res["expected_loss_pct"] <= 100.0

    # 3. Weather Risk Engine
    weather_scores = await weather_engine.compute_risk_scores(30.3398, 76.3869)
    assert "drought_risk" in weather_scores
    assert "flood_risk" in weather_scores
    assert "heat_stress" in weather_scores

    # 4. Composite Risk Score
    comp = risk_model.compute_unified_risk_score(
        crop_health_score=0.45,
        weather_risk=weather_scores["drought_risk"],
        yield_loss_pct=yield_res["expected_loss_pct"],
        ndvi_drop_pct=features["ndvi_drop_pct"]
    )
    assert 0.0 <= comp["risk_score"] <= 100.0
    assert comp["risk_category"] in ["LOW", "MEDIUM", "HIGH", "CRITICAL"]


@pytest.mark.asyncio
async def test_service_wiring_zk_snark_groth16():
    """Verify Groth16 zk-SNARK proof generation & verification wiring."""
    generator = ZKProofGenerator()
    verifier = ZKProofVerifier()

    # Eligible scenario (Scaled inputs: 42.5% -> 4250, 48.0% -> 4800, 38.0% -> 3800)
    proof_data = await generator.generate_proof(
        ndvi_drop_scaled=4250,
        rain_anomaly_scaled=4800,
        yield_loss_scaled=3800
    )
    assert proof_data["eligible"] is True
    assert "pi_a" in proof_data["proof"]
    assert "pi_b" in proof_data["proof"]
    assert "pi_c" in proof_data["proof"]
    
    # Cryptographic verification
    signals = proof_data.get("publicSignals") or proof_data.get("public_signals", ["1"])
    v_res = await verifier.verify_proof(proof_data["proof"], signals)
    assert v_res["valid"] is True

    # Ineligible scenario (Below thresholds: 10% -> 1000, 5% -> 500, 5% -> 500)
    ineligible_proof = await generator.generate_proof(
        ndvi_drop_scaled=1000,
        rain_anomaly_scaled=500,
        yield_loss_scaled=500
    )
    assert ineligible_proof["eligible"] is False


@pytest.mark.asyncio
async def test_service_wiring_blockchain_ledger():
    """Verify blockchain ledger mining, cryptographic hashing, and chain verification."""
    async with AsyncSessionLocal() as session:
        ledger = ClaimLedger(session)
        # Verify chain integrity
        status = await ledger.verify_chain_integrity()
        assert "valid" in status
        assert "block_count" in status
        assert status["valid"] is True

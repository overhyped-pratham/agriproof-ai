"""
AgriProof AI Demo Data Seeder
Populates the database with pre-configured demo scenarios for hackathon presentations.
"""

import json
import hashlib
import os
from pathlib import Path
from datetime import datetime, timezone
import uuid

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select

from app.config import get_settings
from app.models.farm import Farm
from app.models.claim import Claim, AnalysisResult
from app.services.ledger.claim_hash import (
    hash_claim_data,
    hash_satellite_evidence,
    hash_prediction,
    hash_zk_proof,
    compute_block_hash,
    standardize_timestamp,
    GENESIS_BLOCK_HASH
)


def compute_farm_commitment(coords: list) -> str:
    """Canonical SHA-256 commitment of the farm boundary polygon."""
    raw = json.dumps(sorted(coords), separators=(',', ':'))
    return hashlib.sha256(raw.encode('utf-8')).hexdigest()


async def seed_demo_data():
    """Seeds the 3 PRD demo farms and creates an initial verified claim on the ledger."""
    from app.database import init_db
    await init_db()

    settings = get_settings()
    engine = create_async_engine(settings.database_url, echo=False)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    # Locate demo_farms.json
    candidates = [
        Path(__file__).resolve().parent.parent.parent.parent.parent / "data" / "demo_farms.json",
        Path(__file__).resolve().parent.parent.parent.parent / "data" / "demo_farms.json",
        Path("data/demo_farms.json"),
        Path("../data/demo_farms.json"),
    ]
    demo_file = None
    for c in candidates:
        if c.exists():
            demo_file = c
            break
    
    if not demo_file:
        print("Demo file not found in search paths. Skipping seed.")
        return

    with open(demo_file, "r", encoding="utf-8") as f:
        demo_data = json.load(f)

    async with async_session() as session:
        for farm_json in demo_data.get("demo_farms", []):
            # Check if already seeded
            stmt = select(Farm).where(Farm.name == farm_json["name"])
            res = await session.execute(stmt)
            existing_farm = res.scalars().first()

            commitment_hash = compute_farm_commitment(farm_json["polygon_coordinates"])
            sowing_date = datetime.strptime(farm_json["sowing_date"], "%Y-%m-%d").date()

            if not existing_farm:
                farm = Farm(
                    id=farm_json.get("id") or str(uuid.uuid4()),
                    name=farm_json["name"],
                    commitment_hash=commitment_hash,
                    crop_type=farm_json["crop_type"],
                    sowing_date=sowing_date,
                    policy_id=farm_json["policy_id"],
                    center_lat=farm_json["center_lat"],
                    center_lon=farm_json["center_lon"],
                    area_hectares=farm_json["area_hectares"],
                    status="analyzed",
                    created_at=datetime.now(timezone.utc)
                )
                session.add(farm)
                await session.flush()
                farm_id = farm.id
                print(f"  + Seeded farm: {farm.name} ({farm.id})")
            else:
                farm_id = existing_farm.id
                print(f"  ~ Farm exists: {existing_farm.name}")

            # Check if analysis exists
            mock_a = farm_json.get("mock_analysis")
            if mock_a:
                stmt_a = select(AnalysisResult).where(AnalysisResult.farm_id == farm_id)
                res_a = await session.execute(stmt_a)
                if not res_a.scalars().first():
                    analysis = AnalysisResult(
                        id=str(uuid.uuid4()),
                        farm_id=farm_id,
                        crop_health_score=mock_a["crop_health_score"],
                        damage_probability=mock_a["damage_probability"],
                        stress_level=mock_a["stress_level"],
                        ndvi_current=mock_a["ndvi_current"],
                        ndvi_baseline=mock_a["ndvi_baseline"],
                        ndvi_drop_pct=mock_a["ndvi_drop_pct"],
                        evi_current=mock_a["evi_current"],
                        ndwi_current=mock_a["ndwi_current"],
                        ndmi_current=mock_a["ndmi_current"],
                        rainfall_mm_30d=mock_a["rainfall_mm_30d"],
                        rainfall_anomaly_pct=mock_a["rainfall_anomaly_pct"],
                        temperature_mean=mock_a["temperature_mean"],
                        heat_stress_score=mock_a["heat_stress_score"],
                        drought_risk=mock_a["drought_risk"],
                        flood_risk=mock_a["flood_risk"],
                        overall_environmental_risk=mock_a["overall_environmental_risk"],
                        expected_yield=mock_a["expected_yield"],
                        expected_loss_pct=mock_a["expected_loss_pct"],
                        confidence=mock_a["confidence"],
                        risk_score=mock_a["risk_score"],
                        risk_category=mock_a["risk_category"],
                        ndvi_time_series=mock_a["ndvi_time_series"],
                        created_at=datetime.now(timezone.utc)
                    )
                    session.add(analysis)
                    print(f"    + Seeded analysis for {farm_json['name']}")

            # If this is the drought demo farm (eligible), seed an immutable claim on the ledger
            if farm_json["id"] == "demo-farm-001":
                stmt_c = select(Claim).where(Claim.claim_id == "CLM-4821")
                res_c = await session.execute(stmt_c)
                if not res_c.scalars().first():
                    now_dt = datetime.now(timezone.utc)
                    ts = standardize_timestamp(now_dt)
                    sat_hash = hash_satellite_evidence(
                        mock_a["ndvi_time_series"],
                        {"ndvi": mock_a["ndvi_current"], "evi": mock_a["evi_current"]}
                    )
                    pred_hash = hash_prediction({
                        "yield_loss_pct": mock_a["expected_loss_pct"],
                        "risk_score": mock_a["risk_score"]
                    })
                    mock_zk = {
                        "pi_a": ["0x1234a", "0x5678b", "1"],
                        "pi_b": [["0x9abca", "0xdef1b"], ["0x2345c", "0x6789d"], ["1", "0"]],
                        "pi_c": ["0x3456e", "0x7890f", "1"],
                        "protocol": "groth16",
                        "curve": "bn128"
                    }
                    zk_hash = hash_zk_proof(mock_zk)
                    
                    claim_data_hash = hash_claim_data(
                        "CLM-4821",
                        commitment_hash,
                        sat_hash,
                        pred_hash,
                        zk_hash,
                        ts
                    )
                    
                    block_hash = compute_block_hash(
                        previous_block_hash=GENESIS_BLOCK_HASH,
                        claim_hash=claim_data_hash,
                        timestamp=ts,
                        block_index=0
                    )

                    demo_claim = Claim(
                        id=str(uuid.uuid4()),
                        farm_id=farm_id,
                        claim_id="CLM-4821",
                        satellite_evidence_hash=sat_hash,
                        prediction_hash=pred_hash,
                        zk_proof=mock_zk,
                        zk_proof_hash=zk_hash,
                        eligible=True,
                        ndvi_drop_scaled=4150,
                        rain_anomaly_scaled=5830,
                        yield_loss_scaled=3820,
                        block_hash=block_hash,
                        previous_block_hash=GENESIS_BLOCK_HASH,
                        block_index=0,
                        created_at=now_dt,
                        verified_at=now_dt
                    )
                    session.add(demo_claim)
                    print("    + Seeded initial verified claim CLM-4821 on immutable ledger!")

        await session.commit()
    print("[OK] Demo seeding complete.")


if __name__ == "__main__":
    import asyncio
    asyncio.run(seed_demo_data())

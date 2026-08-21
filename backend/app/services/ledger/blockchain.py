import uuid
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import desc

from app.models.claim import Claim
from app.models.farm import Farm
from app.services.ledger.claim_hash import (
    hash_claim_data, hash_satellite_evidence, 
    hash_prediction, hash_zk_proof, compute_block_hash,
    standardize_timestamp, GENESIS_BLOCK_HASH
)

class ClaimLedger:
    def __init__(self, db_session: AsyncSession):
        self.db = db_session
        self.GENESIS_HASH = "0" * 64
        
    async def add_claim(
        self,
        farm_id: str,
        satellite_evidence: dict,
        prediction: dict,
        zk_proof: dict,
        eligible: bool,
        scaled_values: dict
    ) -> Claim:
        
        # Get farm
        result = await self.db.execute(select(Farm).where(Farm.id == farm_id))
        farm = result.scalars().first()
        if not farm:
            raise ValueError(f"Farm not found: {farm_id}")
            
        # Hashes
        sat_hash = hash_satellite_evidence(satellite_evidence.get("timeseries", []), satellite_evidence.get("indices", {}))
        pred_hash = hash_prediction(prediction)
        proof_hash = hash_zk_proof(zk_proof)
        
        # Claim ID
        claim_id = f"CLM-{uuid.uuid4().hex[:8].upper()}"
        now_dt = datetime.utcnow()
        timestamp = standardize_timestamp(now_dt)
        
        claim_hash = hash_claim_data(
            claim_id, farm.commitment_hash, sat_hash, pred_hash, proof_hash, timestamp
        )
        
        # Get previous block
        result = await self.db.execute(select(Claim).order_by(desc(Claim.block_index)).limit(1))
        last_claim = result.scalars().first()
        
        prev_hash = last_claim.block_hash if last_claim else self.GENESIS_HASH
        block_index = (last_claim.block_index + 1) if last_claim else 0
        
        block_hash = compute_block_hash(prev_hash, claim_hash, timestamp, block_index)
        
        claim = Claim(
            farm_id=farm_id,
            claim_id=claim_id,
            satellite_evidence_hash=sat_hash,
            prediction_hash=pred_hash,
            zk_proof=zk_proof,
            zk_proof_hash=proof_hash,
            eligible=eligible,
            ndvi_drop_scaled=scaled_values.get("ndvi_drop_scaled", 0),
            rain_anomaly_scaled=scaled_values.get("rain_anomaly_scaled", 0),
            yield_loss_scaled=scaled_values.get("yield_loss_scaled", 0),
            block_hash=block_hash,
            previous_block_hash=prev_hash,
            block_index=block_index,
            created_at=now_dt
        )
        
        self.db.add(claim)
        await self.db.commit()
        await self.db.refresh(claim)
        
        return claim
        
    async def get_chain(self) -> list[Claim]:
        result = await self.db.execute(select(Claim).order_by(Claim.block_index))
        return result.scalars().all()
        
    async def verify_chain_integrity(self) -> dict:
        claims = await self.get_chain()
        if not claims:
            return {"valid": True, "block_count": 0, "broken_at": None}
            
        prev_hash = self.GENESIS_HASH
        
        for claim in claims:
            if claim.previous_block_hash != prev_hash:
                return {"valid": False, "block_count": len(claims), "broken_at": claim.block_index}
                
            # Recompute claim hash
            result = await self.db.execute(select(Farm).where(Farm.id == claim.farm_id))
            farm = result.scalars().first()
            if not farm:
                return {"valid": False, "block_count": len(claims), "broken_at": claim.block_index}
                
            ts_str = standardize_timestamp(claim.created_at)
            claim_hash = hash_claim_data(
                claim.claim_id, 
                farm.commitment_hash, 
                claim.satellite_evidence_hash, 
                claim.prediction_hash, 
                claim.zk_proof_hash, 
                ts_str
            )
            
            block_hash = compute_block_hash(
                claim.previous_block_hash, claim_hash, ts_str, claim.block_index
            )
            
            if block_hash != claim.block_hash:
                return {"valid": False, "block_count": len(claims), "broken_at": claim.block_index}
                
            prev_hash = claim.block_hash
            
        return {"valid": True, "block_count": len(claims), "broken_at": None}
        
    async def get_claim(self, claim_id: str) -> Claim:
        result = await self.db.execute(select(Claim).where(Claim.claim_id == claim_id))
        return result.scalars().first()

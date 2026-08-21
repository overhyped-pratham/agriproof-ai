import hashlib, json
from datetime import datetime

GENESIS_BLOCK_HASH = "0" * 64

def standardize_timestamp(dt) -> str:
    if dt is None:
        return ""
    if isinstance(dt, str):
        return dt.replace(" ", "T")[:19]
    return dt.strftime("%Y-%m-%dT%H:%M:%S")

def _canonical_json(data) -> str:
    return json.dumps(data, sort_keys=True, separators=(',', ':'))

def hash_claim_data(
    claim_id: str,
    farm_commitment: str,
    satellite_evidence_hash: str,
    prediction_hash: str,
    zk_proof_hash: str,
    timestamp: str
) -> str:
    data = {
        "claim_id": claim_id,
        "farm_commitment": farm_commitment,
        "satellite_evidence_hash": satellite_evidence_hash,
        "prediction_hash": prediction_hash,
        "zk_proof_hash": zk_proof_hash,
        "timestamp": timestamp
    }
    return hashlib.sha256(_canonical_json(data).encode()).hexdigest()

def hash_satellite_evidence(ndvi_timeseries: list, indices: dict) -> str:
    data = {"timeseries": ndvi_timeseries, "indices": indices}
    return hashlib.sha256(_canonical_json(data).encode()).hexdigest()

def hash_prediction(prediction: dict) -> str:
    return hashlib.sha256(_canonical_json(prediction).encode()).hexdigest()

def hash_zk_proof(proof: dict) -> str:
    return hashlib.sha256(_canonical_json(proof).encode()).hexdigest()

def compute_block_hash(
    previous_block_hash: str,
    claim_hash: str,
    timestamp: str,
    block_index: int
) -> str:
    data = f"{previous_block_hash}{claim_hash}{timestamp}{block_index}"
    return hashlib.sha256(data.encode()).hexdigest()

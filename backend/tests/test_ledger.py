import pytest
from app.services.ledger.claim_hash import compute_block_hash, hash_claim_data

def test_hash_chain():
    # Genesis to block 1
    genesis_hash = "0" * 64
    claim_hash_1 = hash_claim_data("CLM-1", "farm1", "sat1", "pred1", "zk1", "2023-01-01T00:00:00")
    block_1 = compute_block_hash(genesis_hash, claim_hash_1, "2023-01-01T00:00:00", 1)
    
    # Block 1 to block 2
    claim_hash_2 = hash_claim_data("CLM-2", "farm2", "sat2", "pred2", "zk2", "2023-01-02T00:00:00")
    block_2 = compute_block_hash(block_1, claim_hash_2, "2023-01-02T00:00:00", 2)
    
    assert block_1 != block_2
    assert block_1 is not None
    assert block_2 is not None
    
def test_hash_integrity():
    # Changing any data changes the hash
    hash1 = hash_claim_data("CLM-1", "farm1", "sat1", "pred1", "zk1", "2023-01-01T00:00:00")
    hash2 = hash_claim_data("CLM-1", "farm1", "sat1", "pred1", "zk1", "2023-01-01T00:00:01")  # timestamp changed
    
    assert hash1 != hash2

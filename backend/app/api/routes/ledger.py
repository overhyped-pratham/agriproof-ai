from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.services.ledger.blockchain import ClaimLedger

router = APIRouter()

@router.get("/ledger")
async def get_ledger(db: AsyncSession = Depends(get_db)):
    ledger = ClaimLedger(db)
    chain = await ledger.get_chain()
    return {"chain": chain}

@router.get("/ledger/verify")
async def verify_ledger(db: AsyncSession = Depends(get_db)):
    ledger = ClaimLedger(db)
    return await ledger.verify_chain_integrity()

import asyncio
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from sqlalchemy.future import select

from app.database import AsyncSessionLocal
from app.models.farm import Farm
from app.services.pipeline import execute_farm_analysis

router = APIRouter()

@router.websocket("/ws/analysis/{farm_id}")
async def analysis_websocket(websocket: WebSocket, farm_id: str):
    await websocket.accept()
    
    try:
        async with AsyncSessionLocal() as db:
            result = await db.execute(select(Farm).where(Farm.id == farm_id))
            farm = result.scalars().first()
            
            if not farm:
                await websocket.send_json({"error": "Farm not found"})
                await websocket.close()
                return

            async def ws_notifier(step: str, status: str, message: str, data=None):
                payload = {
                    "step": step,
                    "status": status,
                    "message": message
                }
                if data:
                    payload["data"] = data
                await websocket.send_json(payload)
                # Small pause for visual smooth animation in frontend
                if status == "running":
                    await asyncio.sleep(0.6)
                elif status == "complete":
                    await asyncio.sleep(0.4)

            analysis = await execute_farm_analysis(farm_id, db, progress_callback=ws_notifier)
            await websocket.send_json({
                "step": "done",
                "status": "complete",
                "message": "Analysis pipeline successfully completed!",
                "data": {
                    "analysis_id": analysis.id,
                    "risk_score": analysis.risk_score,
                    "risk_category": analysis.risk_category,
                    "expected_loss_pct": analysis.expected_loss_pct
                }
            })
            
    except WebSocketDisconnect:
        print(f"[WebSocket] Client disconnected for farm {farm_id}")
    except Exception as e:
        print(f"[WebSocket] Error during analysis: {e}")
        try:
            await websocket.send_json({"error": str(e)})
        except Exception:
            pass

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

            async def ws_notifier(event_dict_or_step, status=None, message=None, data=None):
                if isinstance(event_dict_or_step, dict):
                    payload = event_dict_or_step
                    # Ensure backward compatible step and data keys
                    if "stage" in payload and "step" not in payload:
                        payload["step"] = payload["stage"]
                    if "metadata" in payload and "data" not in payload:
                        payload["data"] = payload["metadata"]
                else:
                    payload = {
                        "step": event_dict_or_step,
                        "stage": event_dict_or_step,
                        "status": status,
                        "progress": 100 if status in ("complete", "completed") else 50,
                        "message": message
                    }
                    if data:
                        payload["data"] = data
                        payload["metadata"] = data

                await websocket.send_json(payload)
                # Small pause for visual smooth animation in frontend
                if payload.get("status") in ("running", "processing"):
                    await asyncio.sleep(0.4)
                elif payload.get("status") in ("complete", "completed"):
                    await asyncio.sleep(0.3)

            analysis = await execute_farm_analysis(farm_id, db, progress_callback=ws_notifier)
            await websocket.send_json({
                "jobId": analysis.id,
                "farmId": farm_id,
                "stage": "done",
                "step": "done",
                "status": "completed",
                "progress": 100,
                "message": "Analysis pipeline successfully completed!",
                "metadata": {
                    "analysis_id": analysis.id,
                    "risk_score": analysis.risk_score,
                    "risk_category": analysis.risk_category,
                    "expected_loss_pct": analysis.expected_loss_pct
                },
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
            await websocket.send_json({"error": str(e), "status": "error"})
        except Exception:
            pass

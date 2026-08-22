"""
Diagnostics & Crop Doctor API Routes — AgriProof AI (inspired by ArogyaKrishi)
Endpoints:
- POST /api/diagnostics/detect-damage -> YOLO/AI leaf disease detection & severity
- POST /api/diagnostics/calculate-dosage -> NPK & fertilizer dosage calculation
- POST /api/diagnostics/gemini-consult -> Multimodal Gemini Agronomist chat
"""

from fastapi import APIRouter, File, UploadFile, Body
from typing import Dict, Any, Optional
from pydantic import BaseModel

from app.services.ai.damage_vision import detect_leaf_damage, DISEASE_KNOWLEDGE_BASE
from app.services.ai.dosage_planner import calculate_dosage_plan, IDEAL_NPK_REQUIREMENTS
from app.services.ai.gemini_advisor import query_gemini_agronomist

router = APIRouter(prefix="/diagnostics", tags=["Diagnostics & Crop Doctor"])

class LeafDetectRequest(BaseModel):
    image_base64: Optional[str] = None
    crop_hint: Optional[str] = None
    filename: Optional[str] = None

class DosageRequest(BaseModel):
    crop: str = "wheat"
    area: float = 1.0
    unit: str = "hectare"
    current_n: float = 40.0
    current_p: float = 20.0
    current_k: float = 20.0
    growth_stage: str = "vegetative"

class GeminiConsultRequest(BaseModel):
    prompt: str
    crop: Optional[str] = "Wheat"
    disease: Optional[str] = None
    area: Optional[float] = 2.5
    language: Optional[str] = "en"

@router.post("/detect-damage")
async def detect_damage_endpoint(req: Optional[LeafDetectRequest] = None):
    """Detect plant leaf disease and visual damage bounding boxes."""
    filename = req.filename if req else None
    image_b64 = req.image_base64 if req else None
    res = detect_leaf_damage(image_b64=image_b64, filename=filename)
    return res

@router.post("/calculate-dosage")
async def calculate_dosage_endpoint(req: DosageRequest):
    """Calculate tailored NPK fertilizer dosage and split schedule."""
    plan = calculate_dosage_plan(
        crop=req.crop,
        area=req.area,
        unit=req.unit,
        current_n=req.current_n,
        current_p=req.current_p,
        current_k=req.current_k,
        growth_stage=req.growth_stage
    )
    return plan

@router.post("/gemini-consult")
async def gemini_consult_endpoint(req: GeminiConsultRequest):
    """Query the Gemini AI Agronomist for guidance and recovery recommendations."""
    context = {
        "crop": req.crop,
        "disease": req.disease,
        "area": req.area
    }
    advice = query_gemini_agronomist(prompt=req.prompt, context=context, language=req.language)
    return advice

@router.get("/disease-classes")
async def list_disease_classes():
    """List all supported plant disease classes and their crop associations."""
    classes = [
        {"key": k, "crop": v["crop"], "disease": v["disease"], "severity": v["severity"]}
        for k, v in DISEASE_KNOWLEDGE_BASE.items()
    ]
    return {"total": len(classes), "classes": classes}

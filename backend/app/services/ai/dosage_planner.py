"""
Dosage Planner Service — AgriProof AI (inspired by ArogyaKrishi)
Calculates exact chemical and organic fertilizer dosage plans based on:
- Target crop (Wheat, Rice, Cotton, Soybean, Corn, Tomato, etc.)
- Farm parcel area (Acres or Hectares)
- Soil N-P-K nutrient levels vs ideal baseline requirements
- Growth stage timeline (Sowing, Vegetative, Flowering, Grain filling)
"""

from typing import Dict, Any, List

# Ideal N-P-K baseline requirements (kg / hectare) by crop
IDEAL_NPK_REQUIREMENTS: Dict[str, Dict[str, float]] = {
    "wheat": {"N": 120.0, "P": 60.0, "K": 40.0, "yield_target_mt": 4.5},
    "rice": {"N": 100.0, "P": 50.0, "K": 50.0, "yield_target_mt": 5.0},
    "cotton": {"N": 150.0, "P": 75.0, "K": 75.0, "yield_target_mt": 2.5},
    "soybean": {"N": 30.0, "P": 80.0, "K": 40.0, "yield_target_mt": 3.0},
    "corn": {"N": 120.0, "P": 60.0, "K": 50.0, "yield_target_mt": 6.0},
    "tomato": {"N": 150.0, "P": 100.0, "K": 120.0, "yield_target_mt": 25.0},
    "sugarcane": {"N": 250.0, "P": 115.0, "K": 115.0, "yield_target_mt": 80.0},
}

def calculate_dosage_plan(
    crop: str,
    area: float,
    unit: str = "hectare",
    current_n: float = 40.0,
    current_p: float = 20.0,
    current_k: float = 20.0,
    growth_stage: str = "vegetative"
) -> Dict[str, Any]:
    """
    Calculates detailed fertilizer dosage recommendation in commercial fertilizer units (Urea, DAP, MOP).
    """
    crop_lower = crop.lower().strip()
    req = IDEAL_NPK_REQUIREMENTS.get(crop_lower, IDEAL_NPK_REQUIREMENTS["wheat"])

    # Convert area to hectares for internal math
    area_ha = area if unit.lower() in ["hectare", "ha"] else area * 0.404686

    # Calculate Deficit (kg/ha)
    def_n = max(0.0, req["N"] - current_n)
    def_p = max(0.0, req["P"] - current_p)
    def_k = max(0.0, req["K"] - current_k)

    # Fertilizer formulas:
    # 1. DAP (18% N, 46% P2O5) -> Satisfies P first
    dap_kg_per_ha = (def_p / 0.46) if def_p > 0 else 0.0
    n_from_dap = dap_kg_per_ha * 0.18

    # 2. Urea (46% N) -> Satisfies remaining N
    remaining_n = max(0.0, def_n - n_from_dap)
    urea_kg_per_ha = (remaining_n / 0.46) if remaining_n > 0 else 0.0

    # 3. MOP (Muriate of Potash, 60% K2O) -> Satisfies K
    mop_kg_per_ha = (def_k / 0.60) if def_k > 0 else 0.0

    # Total quantities for the farm
    total_dap = round(dap_kg_per_ha * area_ha, 1)
    total_urea = round(urea_kg_per_ha * area_ha, 1)
    total_mop = round(mop_kg_per_ha * area_ha, 1)

    # Approximate market cost in INR
    cost_inr = round(total_urea * 6.5 + total_dap * 27.0 + total_mop * 34.0)

    # Split Application Schedule
    schedule: List[Dict[str, Any]] = [
        {
            "stage": "Basal (At Sowing)",
            "timing": "Day 0 - 5",
            "urea_pct": 30,
            "urea_kg": round(total_urea * 0.3, 1),
            "dap_kg": total_dap,  # 100% DAP basal
            "mop_kg": round(total_mop * 0.5, 1),
            "instructions": "Apply full DAP, 50% MOP, and 30% Urea along with 2 tons farmyard manure."
        },
        {
            "stage": "First Top Dressing (Vegetative / Tillering)",
            "timing": "Day 25 - 30",
            "urea_pct": 40,
            "urea_kg": round(total_urea * 0.4, 1),
            "dap_kg": 0.0,
            "mop_kg": 0.0,
            "instructions": "Broadcast Urea after weeding and irrigation. Avoid application during intense heat."
        },
        {
            "stage": "Second Top Dressing (Panicle / Flowering)",
            "timing": "Day 45 - 55",
            "urea_pct": 30,
            "urea_kg": round(total_urea * 0.3, 1),
            "dap_kg": 0.0,
            "mop_kg": round(total_mop * 0.5, 1),
            "instructions": "Apply remaining 30% Urea and 50% MOP to boost grain weight and disease resistance."
        }
    ]

    # Organic / Sustainable alternatives
    organic_plan = {
        "vermicompost_bags": max(5, round(area_ha * 12)),
        "jeevamrut_litres": round(area_ha * 200),
        "neem_cake_kg": round(area_ha * 100),
        "bio_fertilizers": ["Azotobacter (2.5 kg/ha)", "PSB - Phosphate Solubilizing Bacteria (2.5 kg/ha)"]
    }

    return {
        "crop": crop.capitalize(),
        "area": area,
        "unit": unit,
        "area_hectares": round(area_ha, 2),
        "deficits_kg_per_ha": {
            "nitrogen": round(def_n, 1),
            "phosphorous": round(def_p, 1),
            "potassium": round(def_k, 1),
        },
        "fertilizer_recommendations": {
            "urea_kg": total_urea,
            "urea_bags_45kg": round(total_urea / 45.0, 1),
            "dap_kg": total_dap,
            "dap_bags_50kg": round(total_dap / 50.0, 1),
            "mop_kg": total_mop,
            "mop_bags_50kg": round(total_mop / 50.0, 1),
            "estimated_cost_inr": cost_inr
        },
        "schedule": schedule,
        "organic_plan": organic_plan,
        "safety_notes": [
            "Do not mix Urea directly with DAP in high humidity.",
            "Maintain adequate soil moisture before applying top-dressing fertilizers.",
            "Use protective gloves and face mask when handling chemical fertilizers."
        ]
    }

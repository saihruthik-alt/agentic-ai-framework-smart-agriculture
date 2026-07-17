from fastapi import APIRouter, File, UploadFile, HTTPException
from typing import List, Dict

router = APIRouter()

DISEASE_REGISTRY = {
    "tomato": {
        "diseaseName": "Early Blight (Alternaria solani)",
        "localName": "టమోటా ఆకు మాడు తెగులు (Tomato Aaku Maadu Tegulu)",
        "medicine": "Copper Oxychloride (50% WP) or Mancozeb fungicide.",
        "dosage": "Mix 2.5g of Copper Oxychloride per 1 Litre of clean water. Spray thoroughly over foliage.",
        "tips": [
            "Keep foliage dry: Use drip irrigation at soil level instead of overhead sprinklers.",
            "Prune lower leaves: Remove leaves touching the soil to prevent soil-to-foliar transmission.",
            "Maintain spacing: Allow ample crop spacing to ensure ventilation."
        ]
    },
    "rice": {
        "diseaseName": "Paddy Blast (Magnaporthe oryzae)",
        "localName": "వరి ఆకు అగ్గి తెగులు (Vari Aaku Aggi Tegulu)",
        "medicine": "Tricyclazole (75% WP) or Isoprothiolane.",
        "dosage": "Mix 0.6g of Tricyclazole per 1 Litre of water. Apply at first sign of spindle-shaped spots.",
        "tips": [
            "Avoid excessive Nitrogen: High nitrogen urea increases crop susceptibility to blast.",
            "Field sanitation: Clear weed hosts and stubbles from previous season to reduce spores.",
            "Use resistant varieties: Plant certified seeds from local agricultural extension."
        ]
    },
    "cotton": {
        "diseaseName": "Alternaria Leaf Spot",
        "localName": "ప్రత్తి ఆకు మచ్చ తెగులు (Pratti Aaku Maccha Tegulu)",
        "medicine": "Propiconazole (25% EC) or Copper Hydroxide.",
        "dosage": "Mix 1.0ml of Propiconazole per 1 Litre of water. Spray at 10-day intervals.",
        "tips": [
            "Deep plowing: Bury infected plant debris deep into soil after harvest.",
            "Remove volunteer plants: Pull out wild cotton varieties that act as spore reservoirs.",
            "Irrigate early: Apply water early morning so leaves dry quickly in daylight."
        ]
    }
}

@router.post("/cv/disease")
async def classify_leaf_disease(file: UploadFile = File(...)):
    filename_lower = file.filename.lower()
    
    # Simple semantic filename matcher for quick client classifications
    target_key = "tomato"
    if "rice" in filename_lower or "paddy" in filename_lower:
        target_key = "rice"
    elif "cotton" in filename_lower:
        target_key = "cotton"
        
    disease_info = DISEASE_REGISTRY.get(target_key)
    
    return {
        "filename": file.filename,
        "classification": disease_info["diseaseName"],
        "localName": disease_info["localName"],
        "treatment": {
            "medicine": disease_info["medicine"],
            "dosage": disease_info["dosage"],
            "preventiveTips": disease_info["tips"]
        }
    }

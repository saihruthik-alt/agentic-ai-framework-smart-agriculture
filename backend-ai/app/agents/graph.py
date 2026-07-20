from typing import Dict, List, TypedDict, Annotated
import operator
import json
import urllib.request
import math
from langgraph.graph import StateGraph, END
from app.database import SessionLocal
from app.rag.vector_service import search_crop_manuals

# Define Agent state schema
class AgentState(TypedDict):
    messages: Annotated[List[str], operator.add]
    telemetry: Dict[str, float]
    crop: str
    decisions: Dict[str, str]

# Node 1: Weather analysis node with Extreme Weather alerts
def weather_node(state: AgentState) -> Dict:
    messages = ["System: Weather Agent querying Open-Meteo live API..."]
    
    lat = state["telemetry"].get("latitude", 17.3850)
    lon = state["telemetry"].get("longitude", 78.4867)
    
    url = f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&current_weather=true"
    
    temp = 32.0
    wind = 10.0
    weather_desc = "WARM_DRY"
    alerts = []
    
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=5) as response:
            res_data = json.loads(response.read().decode())
            current = res_data.get("current_weather", {})
            if current:
                temp = current.get("temperature", temp)
                wind = current.get("windspeed", wind)
                weathercode = current.get("weathercode", 0)
                
                if weathercode in [1, 2, 3]:
                    weather_desc = "PARTLY_CLOUDY"
                elif weathercode in [51, 53, 55, 61, 63, 65, 80, 81, 82]:
                    weather_desc = "RAINY"
                else:
                    weather_desc = "WARM_DRY"
                
                # Extreme Alert Rules
                if temp > 38.0:
                    alerts.append("🔴 HEATWAVE WARNING: Temperatures exceeding 38°C. Increase irrigation to prevent wilting.")
                elif temp < 5.0:
                    alerts.append("🔴 FROST ALERT: Temperatures below 5°C. Recommend protective mulch layers or light sprinkler runs to create micro-climate insulation.")
                if wind > 30.0:
                    alerts.append("⚠️ HIGH WIND ALERT: Wind speeds over 30 km/h detected. Secure high trellis supports.")
                if weathercode in [65, 82]:
                    alerts.append("🔴 FLOOD RISK: Heavy torrential precipitation detected. Ensure drainage gates are clear.")
                    
                alert_str = " | ".join(alerts) if alerts else "Normal status"
                messages.append(f"Weather Agent: [Open-Meteo] Temp={temp}°C, Wind={wind} km/h, Forecast={weather_desc}. Alerts: {alert_str}")
            else:
                messages.append("Weather Agent: API response empty. Falling back to local climate parameters.")
    except Exception as e:
        messages.append(f"Weather Agent: API query failed ({e}). Falling back to local baseline models.")
        temp = state["telemetry"].get("temperature", 32)
        
    return {
        "messages": messages,
        "decisions": {
            "weather_forecast": weather_desc, 
            "live_temperature": str(temp),
            "extreme_alerts": " | ".join(alerts) if alerts else "None"
        }
    }

# Node 2: Irrigation agent node calculating Evapotranspiration (ET0) & Water Deficit
def irrigation_node(state: AgentState) -> Dict:
    messages = ["System: Irrigation Agent calculating water windows..."]
    moisture = state["telemetry"].get("moisture", 30)
    temp = float(state["decisions"].get("live_temperature", "32.0"))
    crop = state.get("crop", "Rice")
    
    # Calculate simplified Reference Evapotranspiration (ET0) in mm/day
    et0 = 0.18 * temp + 1.2
    
    # Calculate soil water deficit (Volumetric Water Content target is 40%)
    target_moisture = 40.0
    moisture_deficit_percent = max(0.0, target_moisture - moisture)
    
    # Water required to restore soil moisture per acre (liters)
    # 1 mm of water depth over 1 acre = 4,047 liters
    water_req_liters = et0 * 4047 * (moisture_deficit_percent / 100.0)
    
    # Query vector store manual
    manual_guide = ""
    db = SessionLocal()
    try:
        rag_hits = search_crop_manuals(db, crop, "irrigation schedule", limit=1)
        if rag_hits:
            manual_guide = f"\n[RAG Manual: {rag_hits[0]['content']}]"
    except Exception as e:
        manual_guide = f"\n[RAG Lookup Failed: {e}]"
    finally:
        db.close()
        
    if water_req_liters > 0:
        decision = f"Irrigation Agent: Daily ET0 is {et0:.2f}mm. Soil moisture deficit of {moisture_deficit_percent:.1f}%. Recommend irrigating {water_req_liters:.1f} Liters/Acre.{manual_guide}"
        action = "TRIGGER_DRIP"
    else:
        decision = f"Irrigation Agent: Soil moisture is optimal ({moisture}%). No immediate watering required.{manual_guide}"
        action = "DEFER"
        
    messages.append(decision)
    return {
        "messages": messages,
        "decisions": {
            "irrigation_action": action,
            "et0_mm": f"{et0:.2f}",
            "water_required_liters": f"{water_req_liters:.1f}"
        }
    }

# Node 3: Fertilizer agent node with commercial Urea/DAP/MOP bag optimization
def fertilizer_node(state: AgentState) -> Dict:
    messages = ["System: Fertilizer Agent checking NPK status..."]
    n = state["telemetry"].get("nitrogen", 12)
    p = state["telemetry"].get("phosphorus", 10)
    k = state["telemetry"].get("potassium", 20)
    crop = state.get("crop", "Rice")
    
    # Target NPK requirements for 1 Hectare of crop (common agricultural values)
    targets = {
        "rice": {"n": 120, "p": 60, "k": 60},
        "wheat": {"n": 100, "p": 50, "k": 50},
        "cotton": {"n": 80, "p": 40, "k": 40},
        "maize": {"n": 120, "p": 60, "k": 40},
        "default": {"n": 80, "p": 40, "k": 40}
    }
    
    target = targets.get(crop.lower().strip(), targets["default"])
    
    # Convert telemetry ppm/mg-kg values to approximate soil stocks
    # Deficits calculations (kg/hectare required)
    n_deficit = max(0.0, target["n"] - n)
    p_deficit = max(0.0, target["p"] - p)
    k_deficit = max(0.0, target["k"] - k)
    
    # Calculate Commercial Fertilizer Bags needed per Hectare:
    # 1. DAP (Diammonium Phosphate, 18-46-0) supplies Phosphorus first. 
    #    1 bag of DAP (50kg) contains 23kg P2O5 and 9kg N.
    dap_bags = p_deficit / 23.0
    n_supplied_by_dap = dap_bags * 9.0
    
    # 2. Urea (46-0-0) supplies remaining Nitrogen.
    #    1 bag of Urea (50kg) contains 23kg N.
    remaining_n_deficit = max(0.0, n_deficit - n_supplied_by_dap)
    urea_bags = remaining_n_deficit / 23.0
    
    # 3. MOP (Muriate of Potash, 0-0-60) supplies Potassium.
    #    1 bag of MOP (50kg) contains 30kg K2O.
    mop_bags = k_deficit / 30.0
    
    total_cost_est = (urea_bags * 300) + (dap_bags * 1350) + (mop_bags * 1000) # approximate price in ₹
    
    manual_guide = ""
    db = SessionLocal()
    try:
        rag_hits = search_crop_manuals(db, crop, "fertilizer ratio NPK", limit=1)
        if rag_hits:
            manual_guide = f"\n[RAG Manual: {rag_hits[0]['content']}]"
    except Exception as e:
        manual_guide = f"\n[RAG Lookup Failed: {e}]"
    finally:
        db.close()
        
    advice = (f"Fertilizer Agent: Commercial Fertilizer Optimizer recommends applying per Hectare: "
              f"{math.ceil(urea_bags)} bags Urea, {math.ceil(dap_bags)} bags DAP, and {math.ceil(mop_bags)} bags MOP. "
              f"Est. Cost: ₹{round(total_cost_est)}. {manual_guide}")
              
    messages.append(advice)
    return {
        "messages": messages,
        "decisions": {
            "fertilizer_advice": advice,
            "urea_bags": str(math.ceil(urea_bags)),
            "dap_bags": str(math.ceil(dap_bags)),
            "mop_bags": str(math.ceil(mop_bags)),
            "fertilizer_cost_inr": str(round(total_cost_est))
        }
    }

# Compile the multi-agent graph
workflow = StateGraph(AgentState)

# Add nodes
workflow.add_node("weather", weather_node)
workflow.add_node("irrigation", irrigation_node)
workflow.add_node("fertilizer", fertilizer_node)

# Set execution flow entry points
workflow.set_entry_point("weather")
workflow.add_edge("weather", "irrigation")
workflow.add_edge("irrigation", "fertilizer")
workflow.add_edge("fertilizer", END)

# Compile graph
agent_graph = workflow.compile()

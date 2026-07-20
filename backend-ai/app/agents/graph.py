from typing import Dict, List, TypedDict, Annotated
import operator
import json
import urllib.request
from langgraph.graph import StateGraph, END
from app.database import SessionLocal
from app.rag.vector_service import search_crop_manuals

# Define Agent state schema
class AgentState(TypedDict):
    messages: Annotated[List[str], operator.add]
    telemetry: Dict[str, float]
    crop: str
    decisions: Dict[str, str]

# Node 1: Weather analysis node querying live Open-Meteo API
def weather_node(state: AgentState) -> Dict:
    messages = ["System: Weather Agent querying Open-Meteo live API..."]
    
    # Retrieve coordinates from telemetry or default to Hyderabad
    lat = state["telemetry"].get("latitude", 17.3850)
    lon = state["telemetry"].get("longitude", 78.4867)
    
    url = f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&current_weather=true"
    
    temp = 32.0
    wind = 10.0
    weather_desc = "WARM_DRY"
    
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=5) as response:
            res_data = json.loads(response.read().decode())
            current = res_data.get("current_weather", {})
            if current:
                temp = current.get("temperature", temp)
                wind = current.get("windspeed", wind)
                weathercode = current.get("weathercode", 0)
                
                # Weather code descriptors
                if weathercode in [1, 2, 3]:
                    weather_desc = "PARTLY_CLOUDY"
                elif weathercode in [51, 53, 55, 61, 63, 65, 80, 81, 82]:
                    weather_desc = "RAINY"
                else:
                    weather_desc = "WARM_DRY"
                    
                messages.append(f"Weather Agent: [Open-Meteo Live API] Resolved coordinates ({lat}, {lon}). Temperature is {temp}°C, Wind speed is {wind} km/h. Conditions: {weather_desc}.")
            else:
                messages.append("Weather Agent: Open-Meteo API response empty. Falling back to baseline calculations.")
    except Exception as e:
        messages.append(f"Weather Agent: Open-Meteo API query failed ({e}). Falling back to local climate matrices.")
        local_temp = state["telemetry"].get("temperature", 32)
        messages.append(f"Weather Agent: Local temperature index is {local_temp}°C. Conditions: WARM_DRY.")
        
    return {
        "messages": messages,
        "decisions": {"weather_forecast": weather_desc, "live_temperature": str(temp)}
    }

# Node 2: Irrigation agent node with RAG integration
def irrigation_node(state: AgentState) -> Dict:
    messages = ["System: Irrigation Agent calculating water windows..."]
    moisture = state["telemetry"].get("moisture", 30)
    weather = state["decisions"].get("weather_forecast", "WARM_DRY")
    crop = state.get("crop", "Rice")
    
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
        
    decision = f"Irrigation Agent: Optimal moisture profile. Drip schedules deferred.{manual_guide}"
    if moisture < 35 or weather == "WARM_DRY":
        decision = f"Irrigation Agent: Soil moisture is low ({moisture}%). Recommend triggering a 15-minute drip sprinkler run.{manual_guide}"
        
    messages.append(decision)
    return {
        "messages": messages,
        "decisions": {"irrigation_action": "TRIGGER_DRIP" if moisture < 35 else "DEFER"}
    }

# Node 3: Fertilizer agent node with RAG integration
def fertilizer_node(state: AgentState) -> Dict:
    messages = ["System: Fertilizer Agent checking NPK status..."]
    nitro = state["telemetry"].get("nitrogen", 12)
    crop = state.get("crop", "Rice")
    
    # Query vector store manual
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
        
    decision = f"Fertilizer Agent: Nitrogen levels optimal.{manual_guide}"
    if nitro < 10:
        decision = f"Fertilizer Agent: Nitrogen level is deficient ({nitro} mg/kg). Recommend a light urea spray top-dressing.{manual_guide}"
        
    messages.append(decision)
    return {
        "messages": messages,
        "decisions": {"fertilizer_advice": "APPLY_UREA" if nitro < 10 else "HOLD"}
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

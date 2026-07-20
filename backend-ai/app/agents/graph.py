from typing import Dict, List, TypedDict, Annotated
import operator
from langgraph.graph import StateGraph, END
from app.database import SessionLocal
from app.rag.vector_service import search_crop_manuals

# Define Agent state schema
class AgentState(TypedDict):
    messages: Annotated[List[str], operator.add]
    telemetry: Dict[str, float]
    crop: str
    decisions: Dict[str, str]

# Node 1: Weather analysis node
def weather_node(state: AgentState) -> Dict:
    messages = ["System: Weather Agent initiated analysis..."]
    temp = state["telemetry"].get("temperature", 32)
    humidity = state["telemetry"].get("humidity", 65)
    
    analysis = f"Weather Agent: Temperature is {temp}°C, Humidity is {humidity}%. Forecast projects warm dry conditions."
    messages.append(analysis)
    
    return {
        "messages": messages,
        "decisions": {"weather_forecast": "WARM_DRY"}
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

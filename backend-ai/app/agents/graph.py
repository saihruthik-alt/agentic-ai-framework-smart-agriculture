from typing import Dict, List, TypedDict, Annotated
import operator
from langgraph.graph import StateGraph, END

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

# Node 2: Irrigation agent node
def irrigation_node(state: AgentState) -> Dict:
    messages = ["System: Irrigation Agent calculating water windows..."]
    moisture = state["telemetry"].get("moisture", 30)
    weather = state["decisions"].get("weather_forecast", "WARM_DRY")
    
    decision = "Irrigation Agent: Optimal moisture profile. Drip schedules deferred."
    if moisture < 35 or weather == "WARM_DRY":
        decision = f"Irrigation Agent: Soil moisture is low ({moisture}%). Recommend triggering a 15-minute drip sprinkler run."
        
    messages.append(decision)
    return {
        "messages": messages,
        "decisions": {"irrigation_action": "TRIGGER_DRIP" if moisture < 35 else "DEFER"}
    }

# Node 3: Fertilizer agent node
def fertilizer_node(state: AgentState) -> Dict:
    messages = ["System: Fertilizer Agent checking NPK status..."]
    nitro = state["telemetry"].get("nitrogen", 12)
    
    decision = "Fertilizer Agent: Nitrogen levels optimal."
    if nitro < 10:
        decision = f"Fertilizer Agent: Nitrogen level is deficient ({nitro} mg/kg). Recommend a light urea spray top-dressing."
        
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

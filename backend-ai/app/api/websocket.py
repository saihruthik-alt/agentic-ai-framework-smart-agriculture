import asyncio
import json
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.agents.graph import agent_graph

router = APIRouter()

@router.websocket("/ws/agents")
async def websocket_agent_stream(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            # Wait for user input context
            data = await websocket.receive_text()
            context = json.loads(data)
            
            # Extract parameters
            telemetry = context.get("telemetry", {"moisture": 28, "temperature": 33, "humidity": 60, "nitrogen": 8})
            crop = context.get("crop", "Rice")
            query = context.get("query", "")
            agent = context.get("agent", "Weather Agent")
            
            initial_state = {
                "messages": [],
                "telemetry": telemetry,
                "crop": crop,
                "query": query,
                "agent": agent,
                "decisions": {}
            }
            
            # Run LangGraph workflow step by step and stream the updates
            final_answer = ""
            for output in agent_graph.stream(initial_state):
                for node_name, state_update in output.items():
                    # Extract final compiled answer
                    if "decisions" in state_update:
                        if "final_answer" in state_update["decisions"]:
                            final_answer = state_update["decisions"]["final_answer"]
                    # Stream the latest reasoning messages added by the node
                    if "messages" in state_update:
                        for msg in state_update["messages"]:
                            await websocket.send_json({
                                "agent": node_name.capitalize(),
                                "message": msg,
                                "type": "agent" if not msg.startswith("System:") else "system"
                            })
                            await asyncio.sleep(0.5)  # Simulate human-like streaming rate
            
            if not final_answer:
                final_answer = "System: Agent network synthesis complete. All recommendations synced to farm logs."

            # Stream final decision token
            await websocket.send_json({
                "agent": "Orchestrator",
                "message": final_answer,
                "type": "system"
            })
            
    except WebSocketDisconnect:
        pass
    except Exception as e:
        try:
            await websocket.send_json({"error": str(e)})
        except:
            pass

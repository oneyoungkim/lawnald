from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import sys
import os

# Add local directory to path to allow imports
sys.path.append(os.getcwd())

try:
    from backend.chat import chat_manager
except ImportError:
    from chat import chat_manager

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.websocket("/ws/chat/{lawyer_id}/{client_id}/{role}")
async def websocket_endpoint(websocket: WebSocket, lawyer_id: str, client_id: str, role: str):
    from urllib.parse import unquote
    lawyer_id = unquote(lawyer_id)
    client_id = unquote(client_id)
    
    try:
        await chat_manager.connect(websocket, lawyer_id, client_id, role)
    except Exception as e:
        print(f"Connection Error: {e}")
        await websocket.close()
        return

    try:
        while True:
            data = await websocket.receive_text()
            await chat_manager.send_message(lawyer_id, client_id, role, data)
    except WebSocketDisconnect:
        chat_manager.disconnect(lawyer_id, client_id, role)
    except Exception as e:
        print(f"Handler Error: {e}")
        chat_manager.disconnect(lawyer_id, client_id, role)

@app.websocket("/ws/monitor/{lawyer_id}")
async def monitor_endpoint(websocket: WebSocket, lawyer_id: str):
    from urllib.parse import unquote
    lawyer_id = unquote(lawyer_id)
    print(f"Monitor Connection: {lawyer_id}")
    try:
        await chat_manager.connect_monitor(websocket, lawyer_id)
        print(f"Monitor Connected: {lawyer_id}")
    except Exception as e:
        print(f"Monitor Connection Error: {e}")
        await websocket.close()
        return

    try:
        while True:
            # Monitors don't send messages, they just listen.
            # But we need to keep the connection open.
            await websocket.receive_text() 
    except WebSocketDisconnect:
        chat_manager.disconnect_monitor(lawyer_id)
    except Exception as e:
        print(f"Monitor Handler Error: {e}")
        chat_manager.disconnect_monitor(lawyer_id)

if __name__ == "__main__":
    print("Starting Chat Server on port 8003...")
    try:
        uvicorn.run(app, host="127.0.0.1", port=8003)
    except Exception as e:
        print(f"CRITICAL ERROR: {e}")
        import traceback
        traceback.print_exc()

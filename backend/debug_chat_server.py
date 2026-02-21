import sys
import os

# Force unbuffered output
sys.stdout.reconfigure(encoding='utf-8')

print("DEBUG: Starting script", flush=True)

try:
    from fastapi import FastAPI, WebSocket, WebSocketDisconnect
    from fastapi.middleware.cors import CORSMiddleware
    import uvicorn
    print("DEBUG: Imports successful", flush=True)
except Exception as e:
    print(f"DEBUG: Import error: {e}", flush=True)
    sys.exit(1)

sys.path.append(os.getcwd())

print("DEBUG: Loading chat_manager...", flush=True)
try:
    from backend.chat import chat_manager
    print("DEBUG: chat_manager loaded from backend.chat", flush=True)
except ImportError:
    try:
        from chat import chat_manager
        print("DEBUG: chat_manager loaded from chat", flush=True)
    except Exception as e:
        print(f"DEBUG: chat_manager load failed: {e}", flush=True)
        sys.exit(1)

app = FastAPI()
print("DEBUG: FastAPI app created", flush=True)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.websocket("/ws/monitor/{lawyer_id}")
async def monitor(websocket: WebSocket, lawyer_id: str):
    await websocket.accept()
    while True:
        await websocket.receive_text()

if __name__ == "__main__":
    print("DEBUG: Starting uvicorn...", flush=True)
    try:
        uvicorn.run(app, host="127.0.0.1", port=8002)
    except Exception as e:
        print(f"DEBUG: Uvicorn error: {e}", flush=True)

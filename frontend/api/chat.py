import json
import os
import time
from typing import List, Dict
from fastapi import WebSocket
from datetime import datetime
import uuid

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CHAT_DB_FILE = os.path.join(BASE_DIR, "chats.json")

class PresenceManager:
    def __init__(self):
        self.last_active: Dict[str, float] = {} # lawyer_id -> timestamp
        self.OFFLINE_THRESHOLD = 1800 # 30 mins
        self.AWAY_THRESHOLD = 300 # 5 mins

    def update_heartbeat(self, lawyer_id: str):
        self.last_active[lawyer_id] = time.time()

    def get_status(self, lawyer_id: str) -> str:
        last = self.last_active.get(lawyer_id)
        if not last:
            return "offline"
        
        diff = time.time() - last
        if diff < self.AWAY_THRESHOLD:
            return "online"
        elif diff < self.OFFLINE_THRESHOLD:
            return "away"
        else:
            return "offline"

    def is_online(self, lawyer_id: str) -> bool:
        return self.get_status(lawyer_id) == "online"

presence_manager = PresenceManager()

class Message:
    def __init__(self, sender: str, content: str, timestamp: str = None):
        self.sender = sender # "user" or "lawyer"
        self.content = content
        self.timestamp = timestamp or datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    def to_dict(self):
        return {
            "sender": self.sender,
            "content": self.content,
            "timestamp": self.timestamp
        }

class ChatSession:
    def __init__(self, lawyer_id: str, client_id: str, messages: List[Dict] = None):
        self.lawyer_id = lawyer_id
        self.client_id = client_id
        self.messages = messages or []
        self.last_updated = self.messages[-1]["timestamp"] if self.messages else datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    def add_message(self, message: Message):
        self.messages.append(message.to_dict())
        self.last_updated = message.timestamp

    def to_dict(self):
        return {
            "lawyer_id": self.lawyer_id,
            "client_id": self.client_id,
            "messages": self.messages,
            "last_updated": self.last_updated
        }

class ChatManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {} # key: "{lawyer_id}_{client_id}_{role}"
        self.sessions: Dict[str, ChatSession] = {} # key: "{lawyer_id}_{client_id}"
        self.load_chats()

    def get_session_key(self, lawyer_id: str, client_id: str):
        return f"{lawyer_id}_{client_id}"

    async def connect(self, websocket: WebSocket, lawyer_id: str, client_id: str, role: str):
        await websocket.accept()
        key = f"{lawyer_id}_{client_id}_{role}"
        self.active_connections[key] = websocket
        
        # Ensure session exists
        session_key = self.get_session_key(lawyer_id, client_id)
        if session_key not in self.sessions:
            self.sessions[session_key] = ChatSession(lawyer_id, client_id)
            self.save_chats()

    def disconnect(self, lawyer_id: str, client_id: str, role: str):
        key = f"{lawyer_id}_{client_id}_{role}"
        if key in self.active_connections:
            del self.active_connections[key]

    async def send_message(self, lawyer_id: str, client_id: str, sender_role: str, content: str):
        session_key = self.get_session_key(lawyer_id, client_id)
        session = self.sessions.get(session_key)
        
        if not session:
            # Should exist if connected, but safety check
            session = ChatSession(lawyer_id, client_id)
            self.sessions[session_key] = session

        # 1. Save Message
        message = Message(sender=sender_role, content=content)
        session.add_message(message)
        self.save_chats()

        # 2. Broadcast to both parties (Lawyer and User)
        msg_dict = message.to_dict()
        
        # Target: User
        user_conn = self.active_connections.get(f"{lawyer_id}_{client_id}_user")
        if user_conn:
            await user_conn.send_json(msg_dict)
            
        # Target: Lawyer (Specific Chat Room)
        lawyer_conn = self.active_connections.get(f"{lawyer_id}_{client_id}_lawyer")
        if lawyer_conn:
            await lawyer_conn.send_json(msg_dict)

        # 3. Broadcast to Monitors (Global Notification)
        # Monitors are stored in active_connections with a special key prefix or separate list?
        # Let's use a convention: monitor_{lawyer_id}
        monitor_key = f"monitor_{lawyer_id}"
        if monitor_key in self.active_connections:
            # Note: In a real app with multiple tabs, this should be a list of connections.
            # For this prototype, we'll support one active monitor or assume the dict holds one.
            # To support multiple, we would need a list. Let's keep it simple: Single Monitor wins or we broadcast to all if we change structure.
            # But wait, active_connections is Dict[str, WebSocket].
            # If we want multiple tabs to hear validly, we need a list.
            # For now, let's just send to the one stored (last connected).
            monitor_conn = self.active_connections[monitor_key]
            try:
                await monitor_conn.send_json({
                    "type": "new_message",
                    "client_id": client_id,
                    "message": msg_dict
                })
            except Exception as e:
                print(f"Monitor send error: {e}")
                del self.active_connections[monitor_key]

    async def connect_monitor(self, websocket: WebSocket, lawyer_id: str):
        await websocket.accept()
        key = f"monitor_{lawyer_id}"
        self.active_connections[key] = websocket
        
    def disconnect_monitor(self, lawyer_id: str):
        key = f"monitor_{lawyer_id}"
        if key in self.active_connections:
            del self.active_connections[key]

    def get_history(self, lawyer_id: str, client_id: str):
        self.load_chats() # Reload for multi-process support
        session_key = self.get_session_key(lawyer_id, client_id)
        session = self.sessions.get(session_key)
        return session.messages if session else []

    def get_lawyer_chats(self, lawyer_id: str):
        self.load_chats() # Reload for multi-process support
        # Return list of chats for this lawyer
        chats = []
        for session in self.sessions.values():
            if session.lawyer_id == lawyer_id:
                chats.append(session.to_dict())
        
        # Sort by last updated
        chats.sort(key=lambda x: x["last_updated"], reverse=True)
        return chats

    def load_chats(self):
        if os.path.exists(CHAT_DB_FILE):
            try:
                with open(CHAT_DB_FILE, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    for key, val in data.items():
                        self.sessions[key] = ChatSession(
                            val["lawyer_id"], 
                            val["client_id"], 
                            val["messages"]
                        )
                print(f"Loaded {len(self.sessions)} chat sessions.")
            except Exception as e:
                print(f"Failed to load chats: {e}")

    def save_chats(self):
        try:
            data = {k: v.to_dict() for k, v in self.sessions.items()}
            with open(CHAT_DB_FILE, "w", encoding="utf-8") as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
        except Exception as e:
            print(f"Failed to save chats: {e}")

chat_manager = ChatManager()

import json
import os
import time
from typing import List, Dict
from fastapi import WebSocket
from datetime import datetime
import uuid

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
# Fallback file for local dev
_local_chat = os.path.join(BASE_DIR, "chats.json")
CHAT_DB_FILE = _local_chat if os.path.exists(_local_chat) else "/tmp/chats.json"


def _get_sb():
    try:
        from supabase_client import get_supabase  # type: ignore
        return get_supabase()
    except Exception:
        return None


class PresenceManager:
    def __init__(self):
        self.last_active: Dict[str, float] = {}  # lawyer_id -> timestamp
        self.OFFLINE_THRESHOLD = 1800  # 30 mins
        self.AWAY_THRESHOLD = 300  # 5 mins

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
        self.sender = sender
        self.content = content
        self.timestamp = timestamp or datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    def to_dict(self):
        return {"sender": self.sender, "content": self.content, "timestamp": self.timestamp}


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
            "last_updated": self.last_updated,
        }


class ChatManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
        self.sessions: Dict[str, ChatSession] = {}
        self.load_chats()

    def get_session_key(self, lawyer_id: str, client_id: str):
        return f"{lawyer_id}_{client_id}"

    async def connect(self, websocket: WebSocket, lawyer_id: str, client_id: str, role: str):
        await websocket.accept()
        key = f"{lawyer_id}_{client_id}_{role}"
        self.active_connections[key] = websocket
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
            session = ChatSession(lawyer_id, client_id)
            self.sessions[session_key] = session

        message = Message(sender=sender_role, content=content)
        session.add_message(message)
        self.save_chats()

        msg_dict = message.to_dict()

        user_conn = self.active_connections.get(f"{lawyer_id}_{client_id}_user")
        if user_conn:
            await user_conn.send_json(msg_dict)

        lawyer_conn = self.active_connections.get(f"{lawyer_id}_{client_id}_lawyer")
        if lawyer_conn:
            await lawyer_conn.send_json(msg_dict)

        monitor_key = f"monitor_{lawyer_id}"
        if monitor_key in self.active_connections:
            monitor_conn = self.active_connections[monitor_key]
            try:
                await monitor_conn.send_json({
                    "type": "new_message",
                    "client_id": client_id,
                    "message": msg_dict,
                })
            except Exception as e:
                print(f"Monitor send error: {e}")
                del self.active_connections[monitor_key]

    async def connect_monitor(self, websocket: WebSocket, lawyer_id: str):
        await websocket.accept()
        self.active_connections[f"monitor_{lawyer_id}"] = websocket

    def disconnect_monitor(self, lawyer_id: str):
        key = f"monitor_{lawyer_id}"
        if key in self.active_connections:
            del self.active_connections[key]

    def get_history(self, lawyer_id: str, client_id: str):
        self.load_chats()
        session_key = self.get_session_key(lawyer_id, client_id)
        session = self.sessions.get(session_key)
        return session.messages if session else []

    def get_lawyer_chats(self, lawyer_id: str):
        self.load_chats()
        chats = []
        for session in self.sessions.values():
            if session.lawyer_id == lawyer_id:
                chats.append(session.to_dict())
        chats.sort(key=lambda x: x["last_updated"], reverse=True)
        return chats

    # ── Persistence ──────────────────────────────────────

    def load_chats(self):
        """Load chat sessions — Supabase first, then file fallback."""
        sb = _get_sb()
        if sb:
            try:
                res = sb.table("chat_sessions").select("*").execute()
                if res.data:
                    for row in res.data:
                        self.sessions[row["id"]] = ChatSession(
                            row["lawyer_id"], row["client_id"], row.get("messages", [])
                        )
                    print(f"✅ Supabase에서 채팅 {len(res.data)}개 로드")
                    return
            except Exception as e:
                print(f"⚠️ Supabase 채팅 로드 실패: {e}")

        # File fallback
        if os.path.exists(CHAT_DB_FILE):
            try:
                with open(CHAT_DB_FILE, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    for key, val in data.items():
                        self.sessions[key] = ChatSession(
                            val["lawyer_id"], val["client_id"], val["messages"]
                        )
                print(f"Loaded {len(self.sessions)} chat sessions from file.")
            except Exception as e:
                print(f"Failed to load chats: {e}")

    def save_chats(self):
        """Save chat sessions — Supabase first, then file fallback."""
        # 1. Supabase
        sb = _get_sb()
        if sb:
            try:
                rows = [
                    {
                        "id": key,
                        "lawyer_id": s.lawyer_id,
                        "client_id": s.client_id,
                        "messages": s.messages,
                        "last_updated": s.last_updated,
                    }
                    for key, s in self.sessions.items()
                ]
                if rows:
                    sb.table("chat_sessions").upsert(rows, on_conflict="id").execute()
                return
            except Exception as e:
                print(f"⚠️ Supabase 채팅 저장 실패: {e}")

        # 2. File fallback
        try:
            data = {k: v.to_dict() for k, v in self.sessions.items()}
            with open(CHAT_DB_FILE, "w", encoding="utf-8") as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
        except Exception as e:
            print(f"Failed to save chats: {e}")


chat_manager = ChatManager()

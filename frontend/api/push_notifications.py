"""
Lawnald Push Notifications Module
- 디바이스 푸시 토큰 등록
- Expo Push API를 통한 알림 발송
"""

import os
import json
import httpx
from typing import List, Optional
from pydantic import BaseModel
from fastapi import APIRouter, HTTPException

router = APIRouter(prefix="/api/push", tags=["push"])

# --- Data Storage ---
PUSH_TOKENS_FILE = "push_tokens_db.json"

def load_tokens() -> List[dict]:
    if os.path.exists(PUSH_TOKENS_FILE):
        with open(PUSH_TOKENS_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    return []

def save_tokens(db: list):
    with open(PUSH_TOKENS_FILE, "w", encoding="utf-8") as f:
        json.dump(db, f, ensure_ascii=False, indent=2)

TOKENS_DB = load_tokens()


# --- Models ---
class TokenRegister(BaseModel):
    push_token: str
    user_id: Optional[str] = None  # 로그인한 유저 ID (변호사/의뢰인)
    user_type: Optional[str] = None  # "lawyer" or "client"


class PushSend(BaseModel):
    to: str  # push token 또는 user_id
    title: str
    body: str
    data: Optional[dict] = None  # 추가 데이터 (예: URL)


# --- Endpoints ---
@router.post("/register")
async def register_token(req: TokenRegister):
    """디바이스 푸시 토큰 등록"""
    global TOKENS_DB

    # 중복 토큰 제거
    TOKENS_DB = [t for t in TOKENS_DB if t["push_token"] != req.push_token]

    TOKENS_DB.append({
        "push_token": req.push_token,
        "user_id": req.user_id,
        "user_type": req.user_type,
    })
    save_tokens(TOKENS_DB)

    return {"message": "토큰이 등록되었습니다"}


@router.post("/send")
async def send_push(req: PushSend):
    """특정 유저에게 푸시 알림 발송 (Expo Push API)"""
    # to가 ExpoToken 형식이면 직접 사용, 아니면 user_id로 토큰 조회
    tokens_to_send = []

    if req.to.startswith("ExponentPushToken"):
        tokens_to_send.append(req.to)
    else:
        # user_id로 토큰 조회
        matched = [t["push_token"] for t in TOKENS_DB if t.get("user_id") == req.to]
        if not matched:
            raise HTTPException(status_code=404, detail="해당 유저의 토큰을 찾을 수 없습니다")
        tokens_to_send = matched

    # Expo Push API 호출
    messages = [
        {
            "to": token,
            "sound": "default",
            "title": req.title,
            "body": req.body,
            "data": req.data or {},
        }
        for token in tokens_to_send
    ]

    async with httpx.AsyncClient() as client:
        response = await client.post(
            "https://exp.host/--/api/v2/push/send",
            json=messages,
            headers={
                "Content-Type": "application/json",
                "Accept": "application/json",
                "Accept-Encoding": "gzip, deflate",
            },
        )

    if response.status_code != 200:
        raise HTTPException(status_code=500, detail="푸시 발송 실패")

    return {"message": f"{len(tokens_to_send)}개 디바이스에 알림이 발송되었습니다"}


@router.get("/tokens")
async def list_tokens():
    """등록된 토큰 목록 (디버깅용)"""
    return TOKENS_DB

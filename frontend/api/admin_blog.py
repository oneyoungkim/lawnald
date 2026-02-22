"""
Lawnald Admin Blog Module
- 관리자 전용 공식 블로그 CRUD
- AdminPost 모델 (매거진과 분리)
- 관리자 인증 미들웨어
"""

import os
import json
import uuid
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel
from fastapi import APIRouter, HTTPException, Header

router = APIRouter(prefix="/api/admin/blog", tags=["admin-blog"])

# --- Data Storage ---
ADMIN_BLOG_FILE = "admin_blog_db.json"

def load_blog_db() -> List[dict]:
    if os.path.exists(ADMIN_BLOG_FILE):
        with open(ADMIN_BLOG_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    return []

def save_blog_db(db: list):
    with open(ADMIN_BLOG_FILE, "w", encoding="utf-8") as f:
        json.dump(db, f, ensure_ascii=False, indent=2)

ADMIN_BLOG_DB = load_blog_db()

# --- Admin Auth ---
import hashlib

ADMIN_CREDENTIALS = {
    "username": "macdee",
    "password": "02208888md!",
}

def _generate_token(username: str) -> str:
    """간단한 토큰 생성"""
    raw = f"{username}:lawnald-admin-secret-2026"
    return hashlib.sha256(raw.encode()).hexdigest()

ADMIN_TOKEN = _generate_token(ADMIN_CREDENTIALS["username"])

def verify_admin(authorization: Optional[str] = Header(None)):
    """관리자 인증 미들웨어"""
    if not authorization:
        raise HTTPException(status_code=401, detail="인증이 필요합니다")
    token = authorization.replace("Bearer ", "")
    if token != ADMIN_TOKEN:
        raise HTTPException(status_code=403, detail="관리자 권한이 없습니다")


class AdminLoginRequest(BaseModel):
    username: str
    password: str


@router.post("/auth/login")
async def admin_login(req: AdminLoginRequest):
    """관리자 로그인"""
    if req.username != ADMIN_CREDENTIALS["username"] or req.password != ADMIN_CREDENTIALS["password"]:
        raise HTTPException(status_code=401, detail="아이디 또는 비밀번호가 올바르지 않습니다")
    return {
        "message": "로그인 성공",
        "token": ADMIN_TOKEN,
        "username": req.username,
    }


@router.get("/auth/verify")
async def admin_verify(authorization: Optional[str] = Header(None)):
    """관리자 토큰 검증"""
    verify_admin(authorization)
    return {"valid": True, "username": ADMIN_CREDENTIALS["username"]}


# --- Pydantic Models ---
class AdminPostCreate(BaseModel):
    title: str
    content: str  # Markdown content
    summary: str
    category: str = "insights"  # insights, lawyer-spotlight, legal-trends, platform-news
    cover_image: Optional[str] = None
    featured_lawyer_id: Optional[str] = None  # 소개할 변호사 ID
    tags: List[str] = []
    is_published: bool = True


class AdminPostUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    summary: Optional[str] = None
    category: Optional[str] = None
    cover_image: Optional[str] = None
    featured_lawyer_id: Optional[str] = None
    tags: Optional[List[str]] = None
    is_published: Optional[bool] = None


# --- Public API (No Auth) ---
@router.get("/posts")
async def list_posts(category: Optional[str] = None):
    """공개 블로그 글 목록"""
    posts = [p for p in ADMIN_BLOG_DB if p.get("is_published", True)]
    if category:
        posts = [p for p in posts if p.get("category") == category]
    # 최신순 정렬
    posts.sort(key=lambda x: x.get("created_at", ""), reverse=True)
    # 본문 제외한 요약 리스트 반환
    return [{
        "id": p["id"],
        "title": p["title"],
        "summary": p["summary"],
        "category": p["category"],
        "cover_image": p.get("cover_image"),
        "featured_lawyer_id": p.get("featured_lawyer_id"),
        "tags": p.get("tags", []),
        "created_at": p["created_at"],
        "updated_at": p.get("updated_at"),
    } for p in posts]


@router.get("/posts/{post_id}")
async def get_post(post_id: str):
    """공개 블로그 글 상세"""
    post = next((p for p in ADMIN_BLOG_DB if p["id"] == post_id), None)
    if not post or not post.get("is_published", True):
        raise HTTPException(status_code=404, detail="글을 찾을 수 없습니다")

    # featured_lawyer 정보 포함
    featured_lawyer = None
    if post.get("featured_lawyer_id"):
        try:
            from data import LAWYERS_DB
            featured_lawyer = next(
                (l for l in LAWYERS_DB if l["id"] == post["featured_lawyer_id"]), None
            )
            if featured_lawyer:
                featured_lawyer = {
                    "id": featured_lawyer["id"],
                    "name": featured_lawyer["name"],
                    "firm": featured_lawyer.get("firm", ""),
                    "location": featured_lawyer.get("location", ""),
                    "expertise": featured_lawyer.get("expertise", []),
                    "imageUrl": featured_lawyer.get("imageUrl"),
                    "cutoutImageUrl": featured_lawyer.get("cutoutImageUrl"),
                    "introduction_short": featured_lawyer.get("introduction_short"),
                }
        except Exception:
            pass

    return {**post, "featured_lawyer": featured_lawyer}


# --- Admin CRUD (Auth Required) ---
@router.post("/manage")
async def create_post(post: AdminPostCreate, authorization: Optional[str] = Header(None)):
    """관리자: 블로그 글 작성"""
    verify_admin(authorization)

    new_post = {
        "id": str(uuid.uuid4())[:8],
        "title": post.title,
        "content": post.content,
        "summary": post.summary,
        "category": post.category,
        "cover_image": post.cover_image,
        "featured_lawyer_id": post.featured_lawyer_id,
        "tags": post.tags,
        "is_published": post.is_published,
        "author": "로날드 에디터",
        "author_image": "/logo.png",
        "post_type": "ADMIN",
        "created_at": datetime.now().isoformat(),
        "updated_at": datetime.now().isoformat(),
    }

    ADMIN_BLOG_DB.append(new_post)
    save_blog_db(ADMIN_BLOG_DB)
    return {"message": "글이 등록되었습니다", "id": new_post["id"]}


@router.put("/manage/{post_id}")
async def update_post(post_id: str, post: AdminPostUpdate, authorization: Optional[str] = Header(None)):
    """관리자: 블로그 글 수정"""
    verify_admin(authorization)

    existing = next((p for p in ADMIN_BLOG_DB if p["id"] == post_id), None)
    if not existing:
        raise HTTPException(status_code=404, detail="글을 찾을 수 없습니다")

    update_data = post.model_dump(exclude_none=True)
    existing.update(update_data)
    existing["updated_at"] = datetime.now().isoformat()

    save_blog_db(ADMIN_BLOG_DB)
    return {"message": "글이 수정되었습니다"}


@router.delete("/manage/{post_id}")
async def delete_post(post_id: str, authorization: Optional[str] = Header(None)):
    """관리자: 블로그 글 삭제"""
    verify_admin(authorization)

    global ADMIN_BLOG_DB
    before = len(ADMIN_BLOG_DB)
    ADMIN_BLOG_DB = [p for p in ADMIN_BLOG_DB if p["id"] != post_id]

    if len(ADMIN_BLOG_DB) == before:
        raise HTTPException(status_code=404, detail="글을 찾을 수 없습니다")

    save_blog_db(ADMIN_BLOG_DB)
    return {"message": "글이 삭제되었습니다"}


@router.get("/manage/all")
async def list_all_posts(authorization: Optional[str] = Header(None)):
    """관리자: 모든 글 목록 (비공개 포함)"""
    verify_admin(authorization)
    posts = sorted(ADMIN_BLOG_DB, key=lambda x: x.get("created_at", ""), reverse=True)
    return posts

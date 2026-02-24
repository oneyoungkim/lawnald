"""
Lawnald Admin Blog Module
- 관리자 전용 공식 블로그 CRUD
- Supabase 영구 저장 (JSON 파일 폴백)
- 관리자 인증 미들웨어
"""

import os
import json
import uuid
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel  # type: ignore
from fastapi import APIRouter, HTTPException, Header, UploadFile, File  # type: ignore

router = APIRouter(prefix="/api/admin/blog", tags=["admin-blog"])

# --- Supabase 연동 ---
TABLE_NAME = "admin_blog_posts"

def _get_sb():
    """Supabase 클라이언트 반환 (None이면 JSON 폴백)"""
    try:
        from supabase_client import get_supabase  # type: ignore
        return get_supabase()
    except Exception:
        return None


def _load_from_supabase():
    """Supabase에서 블로그 글 전체 로드"""
    sb = _get_sb()
    if sb is None:
        return None
    try:
        res = sb.table(TABLE_NAME).select("*").order("created_at", desc=True).execute()
        posts = []
        for row in res.data or []:
            post = {
                "id": row["id"],
                "title": row.get("title", ""),
                "content": row.get("content", ""),
                "summary": row.get("summary", ""),
                "category": row.get("category", "insights"),
                "cover_image": row.get("cover_image"),
                "featured_lawyer_id": row.get("featured_lawyer_id"),
                "tags": row.get("tags", []),
                "is_published": row.get("is_published", True),
                "author": row.get("author", "로날드 에디터"),
                "author_image": row.get("author_image", "/logo.png"),
                "post_type": row.get("post_type", "ADMIN"),
                "created_at": row.get("created_at", ""),
                "updated_at": row.get("updated_at", ""),
            }
            posts.append(post)
        return posts
    except Exception as e:
        print(f"⚠️ Supabase 블로그 로드 실패: {e}")
        return None


def _upsert_to_supabase(post: dict) -> bool:
    """Supabase에 블로그 글 저장/업데이트"""
    sb = _get_sb()
    if sb is None:
        return False
    try:
        row = {
            "id": post["id"],
            "title": post.get("title", ""),
            "content": post.get("content", ""),
            "summary": post.get("summary", ""),
            "category": post.get("category", "insights"),
            "cover_image": post.get("cover_image"),
            "featured_lawyer_id": post.get("featured_lawyer_id"),
            "tags": post.get("tags", []),
            "is_published": post.get("is_published", True),
            "author": post.get("author", "로날드 에디터"),
            "author_image": post.get("author_image", "/logo.png"),
            "post_type": post.get("post_type", "ADMIN"),
            "created_at": post.get("created_at", datetime.now().isoformat()),
            "updated_at": post.get("updated_at", datetime.now().isoformat()),
        }
        sb.table(TABLE_NAME).upsert(row, on_conflict="id").execute()
        return True
    except Exception as e:
        print(f"⚠️ Supabase 블로그 저장 실패: {e}")
        return False


def _delete_from_supabase(post_id: str) -> bool:
    """Supabase에서 블로그 글 삭제"""
    sb = _get_sb()
    if sb is None:
        return False
    try:
        sb.table(TABLE_NAME).delete().eq("id", post_id).execute()
        return True
    except Exception as e:
        print(f"⚠️ Supabase 블로그 삭제 실패: {e}")
        return False


# --- JSON 파일 폴백 ---
ADMIN_BLOG_FILE = os.path.join("/tmp" if os.path.exists("/tmp") else ".", "admin_blog_db.json")

def _load_from_json() -> List[dict]:
    if os.path.exists(ADMIN_BLOG_FILE):
        try:
            with open(ADMIN_BLOG_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass
    return []

def _save_to_json(db: list):
    try:
        with open(ADMIN_BLOG_FILE, "w", encoding="utf-8") as f:
            json.dump(db, f, ensure_ascii=False, indent=2)
    except Exception as e:
        print(f"⚠️ JSON 저장 실패: {e}")


# --- 초기 로드 ---
def load_blog_db() -> List[dict]:
    # Supabase 우선
    posts = _load_from_supabase()
    if posts is not None:
        print(f"✅ Supabase에서 블로그 글 {len(posts)}개 로드")
        return posts
    # JSON 폴백
    posts = _load_from_json()
    print(f"📁 JSON에서 블로그 글 {len(posts)}개 로드")
    return posts

def save_blog_db(db: list):
    """전체 DB를 JSON에 저장 (폴백용)"""
    _save_to_json(db)

ADMIN_BLOG_DB = load_blog_db()

# --- Admin Auth ---
import hashlib

ADMIN_CREDENTIALS = {
    "username": os.getenv("ADMIN_USERNAME", ""),
    "password": os.getenv("ADMIN_PASSWORD", ""),
}

def _generate_token(username: str) -> str:
    """간단한 토큰 생성 (salt는 환경변수에서 로드)"""
    salt = os.getenv("ADMIN_TOKEN_SALT", os.getenv("JWT_SECRET_KEY", "default-salt"))
    raw = f"{username}:{salt}"
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
    category: str = "insights"
    cover_image: Optional[str] = None
    featured_lawyer_id: Optional[str] = None
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
    # 매번 Supabase에서 최신 데이터 로드 시도
    fresh = _load_from_supabase()
    posts = fresh if fresh is not None else ADMIN_BLOG_DB

    posts = [p for p in posts if p.get("is_published", True)]
    if category:
        posts = [p for p in posts if p.get("category") == category]
    posts.sort(key=lambda x: x.get("created_at", ""), reverse=True)
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
    # Supabase에서 최신 데이터 시도
    fresh = _load_from_supabase()
    source = fresh if fresh is not None else ADMIN_BLOG_DB

    post = next((p for p in source if p["id"] == post_id), None)
    if not post or not post.get("is_published", True):
        raise HTTPException(status_code=404, detail="글을 찾을 수 없습니다")

    featured_lawyer = None
    if post.get("featured_lawyer_id"):  # type: ignore
        try:
            from data import LAWYERS_DB  # type: ignore
            featured_lawyer = next(
                (l for l in LAWYERS_DB if l["id"] == post["featured_lawyer_id"]), None  # type: ignore
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

    return {**post, "featured_lawyer": featured_lawyer}  # type: ignore


# --- Admin CRUD (Auth Required) ---
@router.post("/manage")
async def create_post(post: AdminPostCreate, authorization: Optional[str] = Header(None)):
    """관리자: 블로그 글 작성"""
    verify_admin(authorization)

    new_post = {
        "id": str(uuid.uuid4())[:8],  # type: ignore
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

    # Supabase에 저장
    if not _upsert_to_supabase(new_post):
        print("⚠️ Supabase 저장 실패 → JSON 폴백")

    # 인메모리 + JSON 동기화
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

    # Supabase에 저장
    if not _upsert_to_supabase(existing):
        print("⚠️ Supabase 업데이트 실패 → JSON 폴백")

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

    # Supabase에서 삭제
    _delete_from_supabase(post_id)

    save_blog_db(ADMIN_BLOG_DB)
    return {"message": "글이 삭제되었습니다"}


@router.get("/manage/all")
async def list_all_posts(authorization: Optional[str] = Header(None)):
    """관리자: 모든 글 목록 (비공개 포함)"""
    verify_admin(authorization)
    # Supabase에서 최신 데이터
    fresh = _load_from_supabase()
    source = fresh if fresh is not None else ADMIN_BLOG_DB
    posts = sorted(source, key=lambda x: x.get("created_at", ""), reverse=True)
    return posts


@router.post("/upload-image")
async def upload_blog_image(
    file: UploadFile = File(...),
    authorization: Optional[str] = Header(None),
):
    """관리자: 블로그 이미지 업로드 (클립보드 붙여넣기용)"""
    verify_admin(authorization)

    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="이미지 파일만 업로드 가능합니다")

    file_bytes = await file.read()
    if len(file_bytes) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="5MB 이하의 이미지만 업로드 가능합니다")

    # 고유 파일명 생성
    ext_map = {"image/png": ".png", "image/jpeg": ".jpg", "image/gif": ".gif", "image/webp": ".webp"}
    ext = ext_map.get(file.content_type, ".png")
    timestamp = int(datetime.now().timestamp() * 1000)
    filename = f"blog_{timestamp}_{str(uuid.uuid4())[:6]}{ext}"  # type: ignore

    # Supabase Storage 업로드 시도
    try:
        from storage_utils import upload_and_get_url  # type: ignore
        public_url = upload_and_get_url("photos", f"blog/{filename}", file_bytes, file.content_type)
        if public_url:
            print(f"✅ 블로그 이미지 업로드: {public_url}")
            return {"url": public_url, "filename": filename}
    except Exception as e:
        print(f"⚠️ Supabase Storage 실패: {e}")

    # 폴백: /tmp에 저장
    tmp_dir = "/tmp/uploads/blog"
    os.makedirs(tmp_dir, exist_ok=True)
    filepath = os.path.join(tmp_dir, filename)
    with open(filepath, "wb") as f:
        f.write(file_bytes)  # type: ignore

    fallback_url = f"/uploads/blog/{filename}"
    print(f"📁 블로그 이미지 로컬 저장: {fallback_url}")
    return {"url": fallback_url, "filename": filename}

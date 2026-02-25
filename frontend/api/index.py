# pyright: reportGeneralTypeIssues=false, reportMissingImports=false, reportOptionalMemberAccess=false, reportOptionalSubscript=false, reportOptionalCall=false, reportArgumentType=false, reportIndexIssue=false, reportOperatorIssue=false, reportCallIssue=false, reportReturnType=false, reportAttributeAccessIssue=false, reportMissingModuleSource=false
# pyre-ignore-all-errors
import os
import sys

# Vercel serverless: ensure api/ directory is in Python path
API_DIR = os.path.dirname(os.path.abspath(__file__))
if API_DIR not in sys.path:
    sys.path.insert(0, API_DIR)

from dotenv import load_dotenv  # type: ignore
load_dotenv(os.path.join(API_DIR, '.env'))

from fastapi import FastAPI, Query, UploadFile, File, HTTPException, Form, Body  # type: ignore
from pydantic import BaseModel  # type: ignore
from typing import List, Optional, Dict, Any
from fastapi.middleware.cors import CORSMiddleware  # type: ignore
# StaticFiles removed for Vercel serverless
from search import search_engine  # type: ignore
from data import LAWYERS_DB, save_lawyers_db  # type: ignore
import image_utils  # type: ignore
import os
import json
import seo   # type: ignore
import seo_helper   # type: ignore
from compliance import compliance_engine  # type: ignore
import consultation  # type: ignore
import hashlib 

from datetime import datetime, timedelta
from uuid import uuid4

app = FastAPI()

# Add CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Visitor Tracking (In-Memory) ---
from datetime import datetime, timedelta
from starlette.middleware.base import BaseHTTPMiddleware  # type: ignore
from starlette.requests import Request as StarletteRequest  # type: ignore
import time

# --- Supabase-Persistent Daily Stats ---

def _get_stats_sb():
    """Supabase 클라이언트 반환"""
    try:
        from supabase_client import get_supabase  # type: ignore
        return get_supabase()
    except Exception:
        return None

def _load_stats_from_supabase(date_str: str) -> dict:
    """Supabase에서 특정 날짜의 통계 로드"""
    sb = _get_stats_sb()
    if sb is None:
        return {}
    try:
        res = sb.table("site_stats").select("*").eq("date", date_str).execute()
        if res.data and len(res.data) > 0:
            row = res.data[0]
            return {
                "visitors": row.get("visitors", 0),
                "unique_ips_list": row.get("unique_ips", []),
                "page_views": row.get("page_views", 0),
                "avg_duration_ms": row.get("avg_duration_ms", 0),
            }
    except Exception as e:
        print(f"⚠️ Supabase 통계 로드 실패: {e}")
    return {}

def _load_all_stats_dates() -> list:
    """Supabase에서 통계가 있는 날짜 목록 로드"""
    sb = _get_stats_sb()
    if sb is None:
        return []
    try:
        res = sb.table("site_stats").select("date").order("date", desc=True).limit(30).execute()
        return [r["date"] for r in (res.data or [])]
    except Exception:
        return []

def _flush_today_to_supabase():
    """오늘 통계를 Supabase에 저장 (upsert)"""
    sb = _get_stats_sb()
    if sb is None:
        return

    today = _visitor_data["last_reset"]
    unique_ips_list = list(_visitor_data["unique_ips"])
    page_views = _visitor_data["page_views"]
    times = _visitor_data["request_times"]
    avg_ms = (sum(times) / len(times)) if times else 0  # type: ignore

    try:
        # 기존 데이터 병합 — 여러 서버리스 인스턴스가 동시에 기록할 수 있으므로
        existing = _load_stats_from_supabase(today)
        existing_ips = set(existing.get("unique_ips_list", []))
        merged_ips = existing_ips | set(unique_ips_list)

        # page_views: 기존 값과 현재 값 중 큰 값 사용 (덮어쓰기 방지)
        merged_pv = max(existing.get("page_views", 0), page_views)

        sb.table("site_stats").upsert({
            "date": today,
            "visitors": len(merged_ips),
            "page_views": merged_pv,
            "unique_ips": list(merged_ips),
            "avg_duration_ms": round(avg_ms, 1),
            "updated_at": datetime.now().isoformat(),
        }, on_conflict="date").execute()
    except Exception as e:
        print(f"⚠️ Supabase 통계 저장 실패: {e}")

# Restore today's data from Supabase on startup
_today_str = datetime.now().strftime("%Y-%m-%d")
_saved = _load_stats_from_supabase(_today_str)

_visitor_data = {
    "unique_ips": set(_saved.get("unique_ips_list", [])),
    "page_views": _saved.get("page_views", 0),  # type: ignore
    "request_times": [],
    "last_reset": _today_str,
}
print(f"📊 통계 복원 (Supabase): {_today_str} — 방문자 {len(_visitor_data['unique_ips'])}명, 페이지뷰 {_visitor_data['page_views']}회")

_flush_counter = 0

def _reset_if_new_day():
    global _flush_counter
    today = datetime.now().strftime("%Y-%m-%d")
    if _visitor_data["last_reset"] != today:
        _flush_today_to_supabase()
        _visitor_data["unique_ips"] = set()
        _visitor_data["page_views"] = 0
        _visitor_data["request_times"] = []
        _visitor_data["last_reset"] = today
        _flush_counter = 0

class VisitorTrackingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: StarletteRequest, call_next):
        global _flush_counter
        _reset_if_new_day()
        start = time.time()
        
        client_ip = request.headers.get("x-forwarded-for", request.client.host if request.client else "unknown")
        if client_ip and "," in client_ip:
            client_ip = client_ip.split(",")[0].strip()
        
        path = request.url.path
        if not path.startswith("/_next") and path != "/favicon.ico":
            _visitor_data["unique_ips"].add(client_ip)  # type: ignore
            _visitor_data["page_views"] += 1  # type: ignore
        
        response = await call_next(request)
        
        duration = (time.time() - start) * 1000
        if not path.startswith("/_next") and path != "/favicon.ico":
            _visitor_data["request_times"].append(duration)  # type: ignore
            if len(_visitor_data["request_times"]) > 1000:
                _visitor_data["request_times"] = _visitor_data["request_times"][-500:]  # type: ignore
        
        _flush_counter += 1  # type: ignore
        if _flush_counter >= 20:
            _flush_today_to_supabase()
            _flush_counter = 0
        
        return response

app.add_middleware(VisitorTrackingMiddleware)

# --- Admin Stats Endpoints ---

@app.get("/api/admin/stats")
def get_admin_stats(date: Optional[str] = None):
    """관리자 대시보드 통계 (일별)"""
    _reset_if_new_day()
    _flush_today_to_supabase()
    
    today_str = datetime.now().strftime("%Y-%m-%d")
    query_date = date or today_str
    is_today = (query_date == today_str)
    
    available_dates = _load_all_stats_dates()
    
    if is_today:
        visitors = len(_visitor_data["unique_ips"])
        page_views = _visitor_data["page_views"]
        times = _visitor_data["request_times"]
    else:
        day_data = _load_stats_from_supabase(query_date)
        visitors = day_data.get("visitors", 0)  # type: ignore
        page_views = day_data.get("page_views", 0)  # type: ignore
        avg_saved = day_data.get("avg_duration_ms", 0)  # type: ignore
        times = [avg_saved] if avg_saved else []
    
    # Average duration
    if times and len(times) > 0:
        avg_ms = sum(times) / len(times)  # type: ignore
        if avg_ms > 60000:
            avg_duration = f"{avg_ms / 60000:.1f}분"
        elif avg_ms > 1000:
            avg_duration = f"{avg_ms / 1000:.1f}초"
        else:
            avg_duration = f"{avg_ms:.0f}ms"
    else:
        avg_duration = "—"
    
    today_consultations = 0
    try:
        today_consultations = len(chat_manager.active_rooms) if is_today and hasattr(chat_manager, 'active_rooms') else 0
    except Exception:
        pass
    
    return {
        "date": query_date,
        "visitors": visitors,
        "page_views": page_views,
        "avg_duration": avg_duration,
        "today_consultations": today_consultations,
        "available_dates": available_dates[:30],  # type: ignore
    }

@app.get("/api/admin/stats/dates")
def get_stats_dates():
    dates = _load_all_stats_dates()
    return {"dates": dates}

@app.get("/api/admin/crawler/today-count")
def get_crawler_today_count():
    """오늘 수집된 잠재 파트너 수"""
    try:
        from lawyer_crawler import POTENTIAL_PARTNERS  # type: ignore
        today = datetime.now().strftime("%Y-%m-%d")
        today_count = len([p for p in POTENTIAL_PARTNERS if p.get("collected_at", "").startswith(today)])
        return {"today_count": today_count, "total": len(POTENTIAL_PARTNERS)}
    except (ImportError, Exception):
        return {"today_count": 0, "total": 0}


# --- WebSocket Setup (Declared early) ---
from chat import chat_manager  # type: ignore
from fastapi import WebSocket, WebSocketDisconnect  # type: ignore

@app.websocket("/ws/chat/{lawyer_id}/{client_id}/{role}")
async def websocket_endpoint(websocket: WebSocket, lawyer_id: str, client_id: str, role: str):
    # This endpoint on 8000 might not work due to environment issues, 
    # but we keep it for reference. Real chat should use port 8001.
    await chat_manager.connect(websocket, lawyer_id, client_id, role)
    try:
        while True:
            data = await websocket.receive_text()
            await chat_manager.send_message(lawyer_id, client_id, role, data)
    except WebSocketDisconnect:
        chat_manager.disconnect(lawyer_id, client_id, role)

@app.get("/api/chats/{lawyer_id}/{client_id}/messages")
async def get_chat_history(lawyer_id: str, client_id: str):
    return chat_manager.get_history(lawyer_id, client_id)

@app.get("/api/lawyers/{lawyer_id}/chats")
async def get_lawyer_chats(lawyer_id: str):
    return chat_manager.get_lawyer_chats(lawyer_id)

from routers.crawler import parse_naver_blog_url, get_blog_text, rewrite_with_llm, generate_cover_image  # type: ignore
# NOTE: crawler.router NOT included to avoid stale async endpoint conflict

# 블로그 불러오기 엔드포인트
class BlogImportRequest(BaseModel):
    url: str

@app.post("/api/blog/import")
def blog_import_endpoint(request: BlogImportRequest):
    import traceback as tb
    try:
        blog_id, log_no = parse_naver_blog_url(request.url)
        if not blog_id or not log_no:
            from fastapi.responses import JSONResponse  # type: ignore
            return JSONResponse(status_code=400, content={"detail": "잘못된 네이버 블로그 URL 형식입니다. 개별 포스트 URL을 입력해주세요."})
        
        # ── 중복 URL 체크 (비용 낭비 방지: LLM/DALL-E 호출 전에 확인) ──
        canonical_url = f"https://blog.naver.com/{blog_id}/{log_no}"
        for lawyer in LAWYERS_DB:
            for item in lawyer.get("content_items", []):
                existing_url = item.get("original_url", "")
                if existing_url and (canonical_url in existing_url or existing_url in canonical_url or existing_url == request.url):
                    from fastapi.responses import JSONResponse  # type: ignore
                    return JSONResponse(status_code=409, content={"detail": f"이미 등록된 블로그 글입니다. (등록일: {item.get('date', '알 수 없음')})"})
        
        print(f"[BlogImport] Crawling: {blog_id}/{log_no}")
        original_title, original_text = get_blog_text(blog_id, log_no)
        
        if not original_text or len(original_text.strip()) < 50:
            from fastapi.responses import JSONResponse  # type: ignore
            return JSONResponse(status_code=400, content={"detail": "블로그 글 내용을 추출할 수 없습니다. 비공개 글이거나 내용이 너무 짧습니다."})
        
        print(f"[BlogImport] Got {len(original_text)} chars. LLM rewriting with SEO...")
        llm_result = rewrite_with_llm(original_text)
        
        print(f"[BlogImport] LLM done. Generating illustration image...")
        content_for_image = llm_result.get("content", "")[:1000]
        cover_image = generate_cover_image(content_for_image)
        
        # Embed generated image into content body (replace [IMAGE] placeholder)
        content = llm_result.get("content", original_text)
        if "[IMAGE]" in content:
            image_md = f"\n\n![관련 삽화]({cover_image})\n\n"
            content = content.replace("[IMAGE]", image_md, 1)
            print(f"[BlogImport] ✅ Image embedded into content body")
        else:
            # If LLM didn't place [IMAGE], insert after the first heading
            import re
            heading_match = re.search(r'(^##?\s+.+$)', content, re.MULTILINE)
            if heading_match:
                insert_pos = heading_match.end()
                # Find the next paragraph break
                next_para = content.find('\n\n', insert_pos)
                if next_para != -1:
                    image_md = f"\n\n![관련 삽화]({cover_image})\n\n"
                    content = content[:next_para] + image_md + content[next_para:]
                    print(f"[BlogImport] ✅ Image inserted after first section")
        
        print(f"[BlogImport] ✅ Complete! (SEO title: {llm_result.get('title', '')[:40]}...)")
        return {
            "title": llm_result.get("title", original_title),
            "content": content,
            "category": llm_result.get("category", "기타"),
            "keyword": llm_result.get("keyword", ""),
            "cover_image_url": cover_image,
            "original_url": request.url,
            "meta_description": llm_result.get("meta_description", ""),
            "slug": llm_result.get("slug", "")
        }
    except Exception as e:
        print(f"[BlogImport] ❌ ERROR: {e}")
        tb.print_exc()
        from fastapi.responses import JSONResponse  # type: ignore
        return JSONResponse(status_code=500, content={"detail": f"블로그 불러오기 중 오류: {str(e)}"})

# ── 온디맨드 AI 썸네일 생성 (변호사가 버튼 클릭 시에만 호출) ──
class ThumbnailRequest(BaseModel):
    content: str  # 글 본문 (테마 추출용)

@app.post("/api/generate-thumbnail")
def generate_thumbnail_endpoint(request: ThumbnailRequest):
    """변호사가 [✨ AI 썸네일 생성하기] 버튼을 클릭했을 때만 호출됩니다."""
    try:
        if not request.content or len(request.content.strip()) < 30:
            from fastapi.responses import JSONResponse  # type: ignore
            return JSONResponse(status_code=400, content={"detail": "썸네일 생성을 위해 최소 30자 이상의 본문이 필요합니다."})
        
        print(f"[Thumbnail] 🎨 Generating on-demand thumbnail ({len(request.content)} chars)...")
        image_url = generate_cover_image(request.content[:1000])  # type: ignore
        print(f"[Thumbnail] ✅ Done: {image_url}")
        
        return {"image_url": image_url}
    except Exception as e:
        print(f"[Thumbnail] ❌ ERROR: {e}")
        from fastapi.responses import JSONResponse  # type: ignore
        return JSONResponse(status_code=500, content={"detail": f"이미지 생성 실패: {str(e)}"})

try:
    from billing import router as billing_router  # type: ignore
    app.include_router(billing_router)
except Exception as e:
    print(f"⚠️ billing router skipped: {e}")

try:
    from admin_blog import router as admin_blog_router  # type: ignore
    app.include_router(admin_blog_router)
except Exception as e:
    print(f"⚠️ admin_blog router skipped: {e}")

try:
    from push_notifications import router as push_router  # type: ignore
    app.include_router(push_router)
except Exception as e:
    print(f"⚠️ push_notifications router skipped: {e}")

try:
    from document_generator import router as docgen_router  # type: ignore
    app.include_router(docgen_router)
except Exception as e:
    print(f"⚠️ document_generator router skipped: {e}")

try:
    from evidence_processor import router as evidence_router  # type: ignore
    app.include_router(evidence_router)
except Exception as e:
    print(f"⚠️ evidence_processor router skipped: {e}")

try:
    from case_workspace import router as workspace_router  # type: ignore
    app.include_router(workspace_router)
except Exception as e:
    print(f"⚠️ case_workspace router skipped: {e}")

print("\n" + "="*50)
print("STARTUP: Main.py loaded successfully")
print("="*50 + "\n")






# Vercel serverless: use /tmp for writable directory
try:
    os.makedirs("/tmp/uploads", exist_ok=True)
    os.makedirs("/tmp/temp_uploads", exist_ok=True)
except:
    pass

print(f"Serverless function loaded. CWD={os.getcwd()}")

@app.get("/api/debug/db-status")
def debug_db_status():
    """Debug: Supabase 연결 상태 및 LAWYERS_DB 현황"""
    info = {
        "in_memory_count": len(LAWYERS_DB),
        "in_memory_ids": [l.get("id") for l in LAWYERS_DB],
    }
    try:
        from supabase_client import get_supabase  # type: ignore
        sb = get_supabase()
        info["supabase_connected"] = sb is not None
        if sb:
            res = sb.table("lawyers").select("id, is_mock, verified").execute()
            info["supabase_total"] = len(res.data)
            info["supabase_real"] = [r["id"] for r in res.data if not r.get("is_mock")]
    except Exception as e:
        info["supabase_error"] = str(e)
    return info

# --- Auth System ---

class LoginRequest(BaseModel):
    email: str
    password: str

# Clients DB — Supabase 영구 저장
_seed_clients = [
    {"id": "client1", "email": "client@example.com", "password": "password", "name": "김철수"}
]
try:
    _sb_clients = sb_load_all("clients")
    CLIENTS_DB = _sb_clients if _sb_clients else _seed_clients[:]
except Exception:
    CLIENTS_DB = _seed_clients[:]
print(f"📊 의뢰인 복원: {len(CLIENTS_DB)}명")

class ClientRegisterRequest(BaseModel):
    email: str
    password: str
    name: str

class ConsultationCreateRequest(BaseModel):
    lawyer_id: str
    text: str
    client_name: Optional[str] = None
    client_phone: Optional[str] = None

@app.post("/api/auth/login")
def login(request: LoginRequest):
    # 1. Check for Admin Login (from environment variables)
    _admin_user = os.getenv("ADMIN_USERNAME", "")
    _admin_pass = os.getenv("ADMIN_PASSWORD", "")
    if _admin_user and request.email == _admin_user and request.password == _admin_pass:
        import hashlib as _hl
        _jwt_secret = os.getenv("JWT_SECRET_KEY", "fallback-secret")
        _admin_token = _hl.sha256(f"{_admin_user}:{_jwt_secret}".encode()).hexdigest()
        return {
            "message": "Admin login successful", 
            "token": _admin_token,
            "user": {"name": "관리자", "role": "admin", "email": _admin_user},
            "redirect_to": "/admin/dashboard"
        }

    # 2. Check for Lawyer Login
    # Check both 'id' (used by new signups) and 'email' (if present)
    # 2. Check for Lawyer Login
    # Check both 'id' (used by new signups) and 'email' (if present)
    user = next((u for u in LAWYERS_DB if u.get("id") == request.email or u.get("email") == request.email), None)
    


    if not user:
         # For demo, if email is known mock user, allow
         if request.email == "lawyer1@example.com":
             user = LAWYERS_DB[0]
         else:
            print(f"Login failed for {request.email}")
            raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # In real app, check password hash. Here we skip.
    return {
        "message": "Login successful", 
        "lawyer": user,
        "token": "lawyer_token_123",
        "redirect_to": "/lawyer/dashboard"
    }

@app.post("/api/auth/client/login")
def client_login(request: LoginRequest):
    user = next((u for u in CLIENTS_DB if u["email"] == request.email and u["password"] == request.password), None)
    
    # Mock fallback for demo
    if not user and request.email == "client@example.com":
         user = CLIENTS_DB[0]

    if user:
        return {
            "message": "Client login successful",
            "user": user,
            "token": "client_token_123",
            "redirect_to": "/"
        }
        
    raise HTTPException(status_code=401, detail="Invalid client credentials")

@app.post("/api/auth/client/register")
def client_register(request: ClientRegisterRequest):
    # Check existing
    if any(u["email"] == request.email for u in CLIENTS_DB):
        raise HTTPException(status_code=400, detail="Email already exists")
    
    new_user = {
        "id": f"client_{len(CLIENTS_DB)+1}",
        "email": request.email,
        "password": request.password,
        "name": request.name
    }
    CLIENTS_DB.append(new_user)
    sb_append("clients", new_user, fk_field="email")
    return {"message": "Registration successful", "user": new_user}

# --- Lawyer Signup ---
@app.post("/api/auth/signup/lawyer")
async def signup_lawyer(
    name: str = Form(...),
    email: str = Form(...),
    password: str = Form(...),
    licenseId: str = Form(...),
    firm: str = Form(...),
    phone: str = Form(...),
    licenseImage: UploadFile = File(...)
):
    # Check if email exists
    if any(l["id"] == email for l in LAWYERS_DB):
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Validation: licenseImage must be an image
    if licenseImage.content_type and not licenseImage.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="License file must be an image")

    # Save License Image → Supabase Storage (persistent)
    file_ext = os.path.splitext(licenseImage.filename or "upload.png")[1] or ".png"
    filename = f"{email}_license{file_ext}"
    
    license_bytes = await licenseImage.read()
    license_url = ""
    
    # Try Supabase Storage first
    try:
        from storage_utils import upload_and_get_url  # type: ignore
        sb_url = upload_and_get_url("licenses", filename, license_bytes, licenseImage.content_type or "image/png")
        if sb_url:
            license_url = sb_url
            print(f"✅ 자격증 이미지 Supabase 업로드: {license_url}")
    except Exception as e:
        print(f"⚠️ Supabase Storage 실패: {e}")
    
    # Fallback: save to /tmp
    if not license_url:
        import shutil as _shutil
        upload_dir = "/tmp/uploads/licenses"
        os.makedirs(upload_dir, exist_ok=True)
        file_path = os.path.join(upload_dir, filename)
        try:
            with open(file_path, "wb") as buffer:
                buffer.write(license_bytes)
        except Exception as e:
            print(f"Error saving license image: {e}")
            raise HTTPException(status_code=500, detail="Failed to save license image")
        license_url = f"/uploads/licenses/{filename}"

    new_lawyer = {
        "id": email,
        "email": email,
        "name": name,
        "password": password,
        "firm": firm,
        "location": "서울 (등록 대기)",
        "career": f"변호사 자격증 번호: {licenseId}",
        "education": "",
        "careerTags": ["신규"],
        "gender": "unknown",
        "expertise": ["일반"],
        "matchScore": 0,
        "bestCase": {"title": "등록 대기 중", "summary": "아직 등록된 사례가 없습니다."},
        "imageUrl": "/static/images/default_avatar.png",
        "cutoutImageUrl": "/static/images/default_avatar.png",
        "bgRemoveStatus": "pending",
        "content_items": [],
        "content_highlights": "인증 심사 중",
        "phone": phone,
        "homepage": None,
        "kakao_id": None,
        "verified": False,
        "licenseId": licenseId,
        "licenseImageUrl": license_url
    }

    # --- 파운딩 멤버 혜택 자동 부여 ---
    try:
        from billing import set_founder_benefits, set_standard_trial, FOUNDER_LIMIT  # type: ignore
    except ImportError:
        FOUNDER_LIMIT = 300
        set_founder_benefits = None
        set_standard_trial = None

    if set_founder_benefits and len(LAWYERS_DB) < FOUNDER_LIMIT:
        set_founder_benefits(new_lawyer)
    elif set_standard_trial:
        set_standard_trial(new_lawyer)
    
    LAWYERS_DB.append(new_lawyer)
    save_lawyers_db(LAWYERS_DB)
    
    # 직접 Supabase에 개별 저장 (save_lawyers_db의 대량 upsert 실패 대비)
    try:
        from supabase_client import get_supabase  # type: ignore
        _sb = get_supabase()
        if _sb:
            from datetime import datetime as _dt2
            _sb.table("lawyers").upsert({
                "id": new_lawyer["id"],
                "data": new_lawyer,
                "is_mock": False,
                "verified": False,
                "updated_at": _dt2.now().isoformat(),
            }, on_conflict="id").execute()
            print(f"✅ 변호사 개별 Supabase 저장 완료: {new_lawyer['id']}")
    except Exception as e:
        print(f"⚠️ 변호사 개별 Supabase 저장 실패: {e}")

    founder_msg = " 🎉 가입 신청이 완료되었습니다! 관리자 검토 후 승인됩니다." if new_lawyer.get("is_founder") else " 가입 신청이 완료되었습니다. 관리자 검토 후 승인됩니다."
    return {"message": founder_msg, "lawyer_id": new_lawyer["id"], "is_founder": new_lawyer.get("is_founder", False), "status": "pending_review"}

# --- Serve uploaded files (Vercel serverless can't use StaticFiles) ---
from fastapi.responses import FileResponse  # type: ignore

@app.get("/uploads/{subdir}/{filename}")
def serve_uploaded_file(subdir: str, filename: str):
    """Serve uploaded files (e.g. license images) from /tmp/uploads/"""
    import re
    # Sanitize inputs to prevent path traversal
    if not re.match(r'^[a-zA-Z0-9_-]+$', subdir):
        raise HTTPException(status_code=400, detail="Invalid path")
    if '..' in filename or '/' in filename or '\\' in filename:
        raise HTTPException(status_code=400, detail="Invalid filename")
    
    file_path = os.path.join("/tmp/uploads", subdir, filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(file_path)

# --- Get Single Lawyer Profile ---

@app.get("/api/lawyers/{lawyer_id}")
def get_lawyer_profile(lawyer_id: str):
    """변호사 개별 프로필 조회 (대시보드 갱신용)"""
    lawyer = next((l for l in LAWYERS_DB if l["id"] == lawyer_id), None)
    if not lawyer:
        raise HTTPException(status_code=404, detail="Lawyer not found")
    return lawyer

# --- Admin: Lawyer Approval Endpoints ---

@app.get("/api/admin/lawyers/pending")
def get_pending_lawyers():
    """승인 대기 중인 실제 가입 변호사 목록 (가상 변호사 제외)"""
    pending = [l for l in LAWYERS_DB if not l.get("verified", False) and not l.get("is_mock", False)]
    return pending

@app.post("/api/admin/lawyers/{lawyer_id}/verify")
def verify_lawyer(lawyer_id: str):
    """변호사 가입 승인 (자격증 검토 완료)"""
    lawyer = next((l for l in LAWYERS_DB if l["id"] == lawyer_id), None)
    if not lawyer:
        raise HTTPException(status_code=404, detail="Lawyer not found")
    
    lawyer["verified"] = True
    # 인증 관련 필드 업데이트
    lawyer["location"] = lawyer.get("location", "").replace(" (등록 대기)", "")
    lawyer["matchScore"] = 50  # 검색에 노출되도록 기본 점수 부여
    lawyer["content_highlights"] = "신규 등록 변호사"
    
    # 파운딩 멤버 혜택 부여 (승인 시점에 적용)
    try:
        from billing import set_founder_benefits, set_standard_trial, FOUNDER_LIMIT  # type: ignore
        verified_count = len([l for l in LAWYERS_DB if l.get("verified", False)])
        if verified_count <= FOUNDER_LIMIT and not lawyer.get("is_founder"):
            set_founder_benefits(lawyer)
    except ImportError:
        pass
    
    save_lawyers_db(LAWYERS_DB)
    return {"message": f"{lawyer['name']} 변호사가 승인되었습니다.", "lawyer_id": lawyer_id}

@app.post("/api/admin/lawyers/{lawyer_id}/reject")
def reject_lawyer(lawyer_id: str):
    """변호사 가입 반려"""
    global LAWYERS_DB
    lawyer = next((l for l in LAWYERS_DB if l["id"] == lawyer_id), None)
    if not lawyer:
        raise HTTPException(status_code=404, detail="Lawyer not found")

    lawyer_name = lawyer["name"]
    LAWYERS_DB = [l for l in LAWYERS_DB if l["id"] != lawyer_id]
    save_lawyers_db(LAWYERS_DB)
    return {"message": f"{lawyer_name} 변호사의 가입이 반려되었습니다.", "lawyer_id": lawyer_id}

@app.delete("/api/admin/lawyers/{lawyer_id}")
def delete_lawyer(lawyer_id: str):
    """변호사 완전 삭제"""
    global LAWYERS_DB
    lawyer = next((l for l in LAWYERS_DB if l["id"] == lawyer_id), None)
    if not lawyer:
        raise HTTPException(status_code=404, detail="Lawyer not found")
    
    lawyer_name = lawyer["name"]
    LAWYERS_DB = [l for l in LAWYERS_DB if l["id"] != lawyer_id]
    
    # Supabase에서도 삭제
    try:
        from supabase_client import get_supabase  # type: ignore
        sb = get_supabase()
        if sb:
            sb.table("lawyers").delete().eq("id", lawyer_id).execute()
    except Exception:
        pass
    
    save_lawyers_db(LAWYERS_DB)
    return {"message": f"{lawyer_name} 변호사가 삭제되었습니다.", "lawyer_id": lawyer_id}

# --- Batch Approval / Rejection ---

class BatchLawyerRequest(BaseModel):
    lawyer_ids: List[str]

@app.post("/api/admin/lawyers/batch-verify")
def batch_verify_lawyers(request: BatchLawyerRequest):
    """변호사 일괄 승인"""
    verified_count = 0
    for lawyer_id in request.lawyer_ids:
        lawyer = next((l for l in LAWYERS_DB if l["id"] == lawyer_id), None)
        if lawyer and not lawyer.get("verified", False):
            lawyer["verified"] = True
            lawyer["location"] = lawyer.get("location", "").replace(" (등록 대기)", "")
            lawyer["matchScore"] = 50
            lawyer["content_highlights"] = "신규 등록 변호사"
            verified_count += 1  # type: ignore
            # 파운딩 멤버 혜택
            try:
                from billing import set_founder_benefits, FOUNDER_LIMIT  # type: ignore
                total_verified = len([l for l in LAWYERS_DB if l.get("verified", False)])
                if total_verified <= FOUNDER_LIMIT and not lawyer.get("is_founder"):
                    set_founder_benefits(lawyer)
            except ImportError:
                pass
    save_lawyers_db(LAWYERS_DB)
    return {"message": f"{verified_count}명의 변호사가 승인되었습니다.", "verified_count": verified_count}

@app.post("/api/admin/lawyers/batch-reject")
def batch_reject_lawyers(request: BatchLawyerRequest):
    """변호사 일괄 반려"""
    global LAWYERS_DB
    reject_ids = set(request.lawyer_ids)
    original_count = len(LAWYERS_DB)
    LAWYERS_DB = [l for l in LAWYERS_DB if l["id"] not in reject_ids or l.get("verified", False)]
    rejected_count = original_count - len(LAWYERS_DB)
    save_lawyers_db(LAWYERS_DB)
    return {"message": f"{rejected_count}명의 변호사 가입이 반려되었습니다.", "rejected_count": rejected_count}

# ── Social Login (Kakao / Naver) ──────────────────────────────
class SocialLoginRequest(BaseModel):
    provider: str       # "kakao" | "naver"
    social_id: str      # 소셜 플랫폼 고유 ID
    name: str           # 닉네임 또는 이름
    email: Optional[str] = None  # 이메일 (선택)

@app.post("/api/auth/social/login")
def social_login(request: SocialLoginRequest):
    """카카오/네이버 간편 로그인/가입 — 소셜 ID로 기존 유저 매칭 또는 신규 생성"""
    # 1. 기존 유저 매칭 (social_id 또는 email)
    for user in CLIENTS_DB:
        if user.get("social_id") == request.social_id and user.get("provider") == request.provider:
            return {"message": "Login successful", "user": user, "is_new": False}
        if request.email and user.get("email") == request.email:
            # 이메일이 같은 기존 유저에 소셜 정보 연동
            user["social_id"] = request.social_id
            user["provider"] = request.provider
            return {"message": "Login successful", "user": user, "is_new": False}

    # 2. 신규 유저 자동 가입
    new_user = {
        "id": f"client_{len(CLIENTS_DB)+1}",
        "email": request.email or f"{request.provider}_{request.social_id}@social.local",
        "password": "",
        "name": request.name,
        "provider": request.provider,
        "social_id": request.social_id,
    }
    CLIENTS_DB.append(new_user)
    sb_append("clients", new_user, fk_field="email")
    return {"message": "Registration successful", "user": new_user, "is_new": True}

# --- Lead Notification System ---

class LeadModel(BaseModel):
    id: str
    lawyer_id: str
    case_summary: str
    contact_type: str # phone, homepage, kakao
    timestamp: str

class LeadCreateRequest(BaseModel):
    case_summary: str
    contact_type: str

from persistent_db import sb_append, sb_load_all, sb_load_by_fk, sb_update  # type: ignore

LEADS_DB = sb_load_all("leads") or []
print(f"📊 리드 복원 (Supabase): {len(LEADS_DB)}건")

@app.post("/api/lawyers/{lawyer_id}/leads")
def create_lead(lawyer_id: str, request: LeadCreateRequest):
    # Verify lawyer exists
    lawyer = next((l for l in LAWYERS_DB if l["id"] == lawyer_id), None)
    if not lawyer:
        raise HTTPException(status_code=404, detail="Lawyer not found")
        
    lead = {
        "id": str(uuid4()),
        "lawyer_id": lawyer_id,
        "case_summary": request.case_summary,
        "contact_type": request.contact_type,
        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "stage": "inquiry",  # 칸반 단계: inquiry → consultation → contract → retained → closed
        "client_name": "",
        "client_phone": "",
        "client_email": "",
        "notes": "",
        "priority": "normal",  # low, normal, high, urgent
        "area": "",
    }
    
    LEADS_DB.append(lead)
    sb_append("leads", lead)
    
    print(f"변호사 {lawyer_id}에 대한 리드 생성: {request.contact_type}")
    return {"message": "리드가 성공적으로 접수되었습니다.", "lead_id": lead["id"]}

@app.get("/api/lawyers/{lawyer_id}/leads", response_model=List[LeadModel])
def get_lawyer_leads(lawyer_id: str):
    # Retrieve leads for this lawyer from Supabase
    leads = sb_load_by_fk("leads", "lawyer_id", lawyer_id) or [l for l in LEADS_DB if l["lawyer_id"] == lawyer_id]
    leads.sort(key=lambda x: x.get("timestamp", ""), reverse=True)
    return leads

class LeadUpdateRequest(BaseModel):
    stage: Optional[str] = None
    client_name: Optional[str] = None
    client_phone: Optional[str] = None
    client_email: Optional[str] = None
    notes: Optional[str] = None
    priority: Optional[str] = None
    area: Optional[str] = None
    case_summary: Optional[str] = None

@app.patch("/api/leads/{lead_id}")
def update_lead(lead_id: str, data: LeadUpdateRequest):
    """리드 정보 업데이트 (단계 변경, 메모 추가 등)"""
    lead = next((l for l in LEADS_DB if l["id"] == lead_id), None)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    
    update_fields = data.dict(exclude_none=True)  # type: ignore
    for key, value in update_fields.items():
        lead[key] = value
    
    # Supabase 동기화
    sb_update("leads", lead)
    
    return {"message": "리드가 업데이트되었습니다.", "lead": lead}

@app.delete("/api/leads/{lead_id}")
def delete_lead(lead_id: str):
    """리드 삭제"""
    global LEADS_DB
    lead = next((l for l in LEADS_DB if l["id"] == lead_id), None)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    
    LEADS_DB = [l for l in LEADS_DB if l["id"] != lead_id]
    # Note: Supabase에서도 삭제
    try:
        from supabase_client import get_supabase  # type: ignore
        sb = get_supabase()
        if sb:
            sb.table("leads").delete().eq("id", lead_id).execute()
    except Exception:
        pass
    
    return {"message": "리드가 삭제되었습니다."}


# --- Matter Management (사건 관리) ---

MATTERS_DB: list = []
try:
    _matters_loaded = sb_load_all("matters")
    if _matters_loaded:
        MATTERS_DB = _matters_loaded
        print(f"📊 사건 복원 (Supabase): {len(MATTERS_DB)}건")
except Exception:
    pass

class MatterCreateRequest(BaseModel):
    title: str
    case_number: str = ""
    court: str = ""
    client_name: str = ""
    opponent_name: str = ""
    area: str = ""
    description: str = ""
    status: str = "active"  # active, on_hold, closed, archived

class MatterUpdateRequest(BaseModel):
    title: Optional[str] = None
    case_number: Optional[str] = None
    court: Optional[str] = None
    client_name: Optional[str] = None
    opponent_name: Optional[str] = None
    area: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    next_deadline: Optional[str] = None
    next_deadline_label: Optional[str] = None

class MatterActivityRequest(BaseModel):
    type: str = "note"  # note, deadline, document, event
    content: str
    date: Optional[str] = None

@app.post("/api/matters")
async def create_matter(data: MatterCreateRequest):
    """새 사건/안건 등록"""
    # lawyer_id from header or body
    matter = {
        "id": str(uuid4()),
        "title": data.title,
        "case_number": data.case_number,
        "court": data.court,
        "client_name": data.client_name,
        "opponent_name": data.opponent_name,
        "area": data.area,
        "description": data.description,
        "status": data.status,
        "next_deadline": "",
        "next_deadline_label": "",
        "created_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "updated_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "activities": [],
    }
    MATTERS_DB.append(matter)
    sb_append("matters", matter)
    return {"message": "사건이 등록되었습니다.", "matter": matter}

@app.get("/api/matters")
async def list_matters(status: Optional[str] = None):
    """사건 목록 조회"""
    matters = MATTERS_DB
    if status:
        matters = [m for m in matters if m.get("status") == status]
    return sorted(matters, key=lambda x: x.get("updated_at", ""), reverse=True)

@app.get("/api/matters/{matter_id}")
async def get_matter(matter_id: str):
    """사건 상세 조회"""
    matter = next((m for m in MATTERS_DB if m["id"] == matter_id), None)
    if not matter:
        raise HTTPException(status_code=404, detail="Matter not found")
    return matter

@app.patch("/api/matters/{matter_id}")
async def update_matter(matter_id: str, data: MatterUpdateRequest):
    """사건 정보 업데이트"""
    matter = next((m for m in MATTERS_DB if m["id"] == matter_id), None)
    if not matter:
        raise HTTPException(status_code=404, detail="Matter not found")
    
    for key, value in data.dict(exclude_none=True).items():  # type: ignore
        matter[key] = value
    matter["updated_at"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    sb_update("matters", matter)
    return {"message": "사건이 업데이트되었습니다.", "matter": matter}

@app.delete("/api/matters/{matter_id}")
async def delete_matter(matter_id: str):
    """사건 삭제"""
    global MATTERS_DB
    matter = next((m for m in MATTERS_DB if m["id"] == matter_id), None)
    if not matter:
        raise HTTPException(status_code=404, detail="Matter not found")
    MATTERS_DB = [m for m in MATTERS_DB if m["id"] != matter_id]
    return {"message": "사건이 삭제되었습니다."}

@app.post("/api/matters/{matter_id}/activities")
async def add_matter_activity(matter_id: str, data: MatterActivityRequest):
    """사건에 활동 기록 추가 (메모, 기일, 문서 등)"""
    matter = next((m for m in MATTERS_DB if m["id"] == matter_id), None)
    if not matter:
        raise HTTPException(status_code=404, detail="Matter not found")
    
    activity = {
        "id": str(uuid4()),
        "type": data.type,
        "content": data.content,
        "date": data.date or datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "created_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
    }
    
    if "activities" not in matter:
        matter["activities"] = []
    matter["activities"].insert(0, activity)
    matter["updated_at"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    sb_update("matters", matter)
    return {"message": "활동이 추가되었습니다.", "activity": activity}



# 의뢰인 사연 저장 DB
CLIENT_STORIES_DB = sb_load_all("client_stories") or []
print(f"📊 의뢰인 사연 복원 (Supabase): {len(CLIENT_STORIES_DB)}건")

class ClientStoryRequest(BaseModel):
    client_id: str
    title: str
    content: str
    area: Optional[str] = None

@app.post("/api/client/stories")
def save_client_story(request: ClientStoryRequest):
    story = {
        "id": str(uuid4()),
        "client_id": request.client_id,
        "title": request.title,
        "content": request.content,
        "area": request.area or "미분류",
        "created_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "status": "접수완료"
    }
    CLIENT_STORIES_DB.append(story)
    sb_append("client_stories", story, fk_field="client_id")
    return {"message": "사연이 저장되었습니다.", "story": story}

@app.get("/api/client/{client_id}/stories")
def get_client_stories(client_id: str):
    stories = sb_load_by_fk("client_stories", "client_id", client_id) or [s for s in CLIENT_STORIES_DB if s["client_id"] == client_id]
    stories.sort(key=lambda x: x.get("created_at", ""), reverse=True)
    return stories

@app.get("/api/client/{client_id}/chats")
def get_client_chats(client_id: str):
    from chat import chat_manager  # type: ignore
    chat_manager.load_chats()
    chats = []
    for session in chat_manager.sessions.values():
        if session.client_id == client_id:
            # Find lawyer name
            lawyer = next((l for l in LAWYERS_DB if l["id"] == session.lawyer_id), None)
            chat_data = session.to_dict()
            chat_data["lawyer_name"] = lawyer["name"] if lawyer else "알 수 없음"
            chat_data["lawyer_firm"] = lawyer.get("firm", "") if lawyer else ""
            chat_data["lawyer_image"] = lawyer.get("imageUrl") if lawyer else None
            chats.append(chat_data)
    chats.sort(key=lambda x: x["last_updated"], reverse=True)
    return chats

# --- Client Portal APIs ---

class ClientMessageRequest(BaseModel):
    client_name: str
    content: str

@app.get("/api/client/{client_id}/portal")
async def get_client_portal(client_id: str):
    """
    클라이언트 포털: 의뢰인의 사건 현황, 활동 기록, 변호사 정보를 조회합니다.
    client_id에 연결된 사건(matter)을 client_name 매칭으로 조회합니다.
    """
    # 의뢰인 정보 가져오기
    client = None
    for c in CLIENTS_DB:
        if c.get("id") == client_id:
            client = c
            break
    
    client_name = client.get("name", "") if client else ""
    client_email = client.get("email", "") if client else ""
    
    # 사건 목록 (client_name 매칭)
    client_matters = []
    for m in MATTERS_DB:
        if (m.get("client_name", "").strip() and 
            (m.get("client_name", "").strip() == client_name.strip() or
             client_email in str(m))):
            # 민감 정보 필터링 (description은 요약만)
            safe_matter = {
                "id": m["id"],
                "title": m.get("title", ""),
                "case_number": m.get("case_number", ""),
                "court": m.get("court", ""),
                "area": m.get("area", ""),
                "status": m.get("status", "active"),
                "next_deadline": m.get("next_deadline", ""),
                "next_deadline_label": m.get("next_deadline_label", ""),
                "created_at": m.get("created_at", ""),
                "updated_at": m.get("updated_at", ""),
                "activities": [
                    a for a in m.get("activities", [])
                    if a.get("type") in ("event", "deadline", "client_message")
                ],
            }
            client_matters.append(safe_matter)
    
    # 리드 정보 (상담 상태)
    client_leads = []
    for l in LEADS_DB:
        if client_name and l.get("client_name", "").strip() == client_name.strip():
            client_leads.append({
                "stage": l.get("stage", "inquiry"),
                "area": l.get("area", ""),
                "timestamp": l.get("timestamp", ""),
            })
    
    return {
        "client_name": client_name,
        "matters": sorted(client_matters, key=lambda x: x.get("updated_at", ""), reverse=True),
        "leads": client_leads,
        "total_matters": len(client_matters),
    }

@app.post("/api/matters/{matter_id}/client-messages")
async def add_client_message(matter_id: str, data: ClientMessageRequest):
    """의뢰인이 사건에 메시지를 남깁니다."""
    matter = next((m for m in MATTERS_DB if m["id"] == matter_id), None)
    if not matter:
        raise HTTPException(status_code=404, detail="Matter not found")
    
    activity = {
        "id": str(uuid4()),
        "type": "client_message",
        "content": f"[의뢰인 {data.client_name}] {data.content}",
        "date": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "created_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
    }
    if "activities" not in matter:
        matter["activities"] = []
    matter["activities"].insert(0, activity)
    matter["updated_at"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    sb_update("matters", matter)
    return {"message": "메시지가 전달되었습니다.", "activity": activity}


# --- Document Automation (문서 자동화) ---

DOC_TEMPLATES = {
    "complaint": {"name": "소장", "desc": "민사소송 소장", "file": "complaint.txt"},
    "answer": {"name": "답변서", "desc": "피고 답변서", "file": "answer.txt"},
    "brief": {"name": "준비서면", "desc": "변론 준비서면", "file": "brief.txt"},
    "payment_order": {"name": "지급명령신청서", "desc": "지급명령 신청", "file": "payment_order.txt"},
    "power_of_attorney": {"name": "위임장", "desc": "소송 위임장", "file": "power_of_attorney.txt"},
    "settlement": {"name": "합의서", "desc": "분쟁 합의서", "file": "settlement.txt"},
    "demand_letter": {"name": "내용증명", "desc": "내용증명 우편", "file": "demand_letter.txt"},
    "provisional_attachment": {"name": "가압류신청서", "desc": "부동산/채권 가압류", "file": "provisional_attachment.txt"},
    "criminal_complaint": {"name": "고소장", "desc": "형사 고소장", "file": "criminal_complaint.txt"},
    "statement": {"name": "진술서", "desc": "사실 진술서", "file": "statement.txt"},
    "retainer_agreement": {"name": "수임계약서", "desc": "법률사무 위임계약", "file": "retainer_agreement.txt"},
    "appeal": {"name": "항소장", "desc": "항소 제기", "file": "appeal.txt"},
    "provisional_injunction": {"name": "가처분신청서", "desc": "처분금지 가처분", "file": "provisional_injunction.txt"},
}

import pathlib as _pathlib  # type: ignore
_TEMPLATE_DIR = _pathlib.Path(__file__).parent / "templates"

def _load_template(filename: str) -> str:
    """templates/ 폴더에서 양식 파일을 로드합니다."""
    try:
        return (_TEMPLATE_DIR / filename).read_text(encoding="utf-8")
    except Exception:
        return ""


class DocGenerateRequest(BaseModel):
    doc_type: str  # complaint, answer, brief, etc.
    matter_id: Optional[str] = None
    plaintiff_name: str = ""
    defendant_name: str = ""
    court: str = ""
    case_number: str = ""
    case_summary: str = ""
    claim_amount: str = ""
    additional_info: str = ""

@app.get("/api/documents/templates")
async def get_doc_templates():
    """사용 가능한 문서 템플릿 목록"""
    return DOC_TEMPLATES

@app.post("/api/documents/generate")
async def generate_document(data: DocGenerateRequest):
    """AI 기반 법률 문서 자동 생성"""
    template = DOC_TEMPLATES.get(data.doc_type)
    if not template:
        raise HTTPException(status_code=400, detail=f"Unknown document type: {data.doc_type}")
    
    # Matter 데이터 자동 채우기
    matter_info = ""
    if data.matter_id:
        matter = next((m for m in MATTERS_DB if m["id"] == data.matter_id), None)
        if matter:
            matter_info = f"""
사건명: {matter.get('title', '')}
사건번호: {matter.get('case_number', '')}
법원: {matter.get('court', '')}
의뢰인: {matter.get('client_name', '')}
상대방: {matter.get('opponent_name', '')}
사건개요: {matter.get('description', '')}
"""
    
    # 템플릿 파일에서 양식 로드 (templates/ 폴더)
    template_file = template.get("file", "")
    file_template = _load_template(template_file) if template_file else ""
    
    # 변수 치환
    format_guide = file_template
    format_guide = format_guide.replace("[원고 성명]", data.plaintiff_name or "○○○")
    format_guide = format_guide.replace("[피고 성명]", data.defendant_name or "○○○")
    format_guide = format_guide.replace("[채권자 성명]", data.plaintiff_name or "○○○")
    format_guide = format_guide.replace("[채무자 성명]", data.defendant_name or "○○○")
    format_guide = format_guide.replace("[고소인 성명]", data.plaintiff_name or "○○○")
    format_guide = format_guide.replace("[피고소인 성명]", data.defendant_name or "○○○")
    format_guide = format_guide.replace("[갑 성명]", data.plaintiff_name or "○○○")
    format_guide = format_guide.replace("[을 성명]", data.defendant_name or "○○○")
    format_guide = format_guide.replace("[발신인 성명]", data.plaintiff_name or "○○○")
    format_guide = format_guide.replace("[수신인 성명]", data.defendant_name or "○○○")
    format_guide = format_guide.replace("[위임인 성명]", data.plaintiff_name or "○○○")
    format_guide = format_guide.replace("[의뢰인 성명]", data.plaintiff_name or "○○○")
    format_guide = format_guide.replace("[법원명]", data.court or "○○지방법원")
    format_guide = format_guide.replace("[청구금액]", data.claim_amount or "○○○○")
    format_guide = format_guide.replace("[합의금액]", data.claim_amount or "○○○○")

    prompt = f"""당신은 대한민국 15년차 전문 변호사입니다.
아래 '표준 양식'의 구조를 **완전히 따르되**, 대괄호([]) 안의 설명문은 사건 내용에 맞게 구체적으로 작성하세요.

=== 표준 양식 ===
{format_guide}


=== 사건 내용 ===
{data.case_summary or '(미입력)'}

{f'=== 사건 관리 데이터 ===' + matter_info if matter_info else ''}

=== 추가 지시사항 ===
{data.additional_info or '없음'}

[필수 규칙]
1. 위 양식의 구조와 포맷(들여쓰기, 정렬, 항번호)을 정확히 따를 것
2. 실제 사건 내용을 반영하여 구체적으로 작성할 것
3. 관련 법률 조항을 명시하고 판례가 있다면 인용할 것
4. 법원 제출 가능한 수준의 완성도로 작성할 것
"""

    try:
        import openai  # type: ignore
        client_ai = openai.OpenAI()
        response = client_ai.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": "당신은 15년 경력의 대한민국 전문 변호사입니다. 법원 제출용 서면을 작성합니다."},
                {"role": "user", "content": prompt},
            ],
            temperature=0.3,
            max_tokens=4000,
        )
        content = response.choices[0].message.content  # type: ignore
        return {
            "doc_type": data.doc_type,
            "template_name": template["name"],
            "content": content,
            "generated_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"문서 생성 실패: {str(e)}")


# --- AI Draft Generation (AI 초안 생성) ---

class AIDraftRequest(BaseModel):
    case_summary: str
    doc_type: str = "brief"  # brief, complaint, answer
    lawyer_id: Optional[str] = None
    matter_id: Optional[str] = None
    style_instructions: str = ""

@app.post("/api/ai/draft")
async def generate_ai_draft(data: AIDraftRequest):
    """과거 승소사례를 참고하여 AI 초안을 생성합니다."""
    
    # 1. RAG로 유사 사례 검색
    similar_cases = []
    try:
        from case_embeddings import search_similar_cases  # type: ignore
        similar_cases = search_similar_cases(query=data.case_summary, top_k=3, threshold=0.4)
    except Exception:
        pass
    
    # 2. Matter 데이터 가져오기
    matter_context = ""
    if data.matter_id:
        matter = next((m for m in MATTERS_DB if m["id"] == data.matter_id), None)
        if matter:
            matter_context = f"""
[사건 정보]
사건명: {matter.get('title', '')}
사건번호: {matter.get('case_number', '')}
법원: {matter.get('court', '')}
의뢰인: {matter.get('client_name', '')}
상대방: {matter.get('opponent_name', '')}
"""
    
    # 3. 유사 사례 컨텍스트 구성
    rag_context = ""
    if similar_cases:
        rag_context = "\n\n[참고 유사 사례]\n"
        for i, case in enumerate(similar_cases[:3], 1):
            rag_context += f"\n--- 사례 {i} (유사도: {case.get('similarity', 0):.0%}) ---\n"
            rag_context += f"제목: {case.get('title', '')}\n"
            rag_context += f"요약: {case.get('content_summary', '')}\n"
            rag_context += f"태그: {case.get('ai_tags', '')}\n"
    
    doc_names = {"brief": "준비서면", "complaint": "소장", "answer": "답변서"}
    doc_name = doc_names.get(data.doc_type, "법률 서면")
    
    prompt = f"""당신은 대한민국 15년차 전문 변호사입니다.
아래 사건 내용과 유사 승소사례를 참고하여 [{doc_name}] 초안을 작성하세요.

[사건 개요]
{data.case_summary}

{matter_context}
{rag_context}

{f'[변호사 스타일 지시]' + chr(10) + data.style_instructions if data.style_instructions else ''}

[작성 규칙]
1. 유사 승소사례의 논증 구조와 법적 논리를 참고하되, 현재 사건에 맞게 변형
2. 실제 법원 제출 가능한 수준의 전문적 서면 작성
3. 관련 법률 조항 및 판례 인용
4. 체계적인 번호 매김 (제1항, 가, (1) 등)
5. 청구 취지와 원인을 명확하게
"""

    try:
        import openai  # type: ignore
        client_ai = openai.OpenAI()
        response = client_ai.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": "당신은 대한민국 전문 변호사로, 과거 승소 경험을 바탕으로 새 사건의 서면 초안을 작성합니다."},
                {"role": "user", "content": prompt},
            ],
            temperature=0.3,
            max_tokens=4000,
        )
        content = response.choices[0].message.content  # type: ignore
        return {
            "draft": content,
            "similar_cases_used": len(similar_cases),
            "doc_type": data.doc_type,
            "generated_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"초안 생성 실패: {str(e)}")


# --- E-Signature (전자서명) ---

ESIGN_DB: list = []

class ESignCreateRequest(BaseModel):
    title: str  # 예: "수임계약서", "위임장"
    content: str  # 서명할 문서 내용
    signer_name: str
    signer_email: str = ""
    lawyer_name: str = ""

class ESignSignRequest(BaseModel):
    signer_name: str
    signature_data: str = ""  # base64 서명 이미지 또는 텍스트

@app.post("/api/esign/create")
async def create_esign(data: ESignCreateRequest):
    """전자서명 요청 생성"""
    doc = {
        "id": str(uuid4()),
        "title": data.title,
        "content": data.content,
        "signer_name": data.signer_name,
        "signer_email": data.signer_email,
        "lawyer_name": data.lawyer_name,
        "status": "pending",  # pending, signed, expired
        "created_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "signed_at": None,
        "signature_data": None,
    }
    ESIGN_DB.append(doc)
    return {"message": "서명 요청이 생성되었습니다.", "esign": doc}

@app.get("/api/esign/{esign_id}")
async def get_esign(esign_id: str):
    """서명 문서 조회"""
    doc = next((d for d in ESIGN_DB if d["id"] == esign_id), None)
    if not doc:
        raise HTTPException(status_code=404, detail="문서를 찾을 수 없습니다.")
    return doc

@app.post("/api/esign/{esign_id}/sign")
async def sign_document(esign_id: str, data: ESignSignRequest):
    """전자서명 완료"""
    doc = next((d for d in ESIGN_DB if d["id"] == esign_id), None)
    if not doc:
        raise HTTPException(status_code=404, detail="문서를 찾을 수 없습니다.")
    if doc["status"] == "signed":
        raise HTTPException(status_code=400, detail="이미 서명된 문서입니다.")
    
    doc["status"] = "signed"
    doc["signed_at"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    doc["signature_data"] = data.signature_data or f"[전자서명: {data.signer_name}]"
    
    return {"message": "서명이 완료되었습니다.", "esign": doc}

@app.get("/api/esign")
async def list_esigns():
    """모든 서명 문서 목록"""
    return sorted(ESIGN_DB, key=lambda x: x.get("created_at", ""), reverse=True)

@app.get("/api/lawyers/online")
def get_online_lawyers():
    from chat import presence_manager  # type: ignore
    online = []
    for lawyer in LAWYERS_DB:
        status = presence_manager.get_status(lawyer["id"])
        if status in ("online", "away"):
            online.append({
                "id": lawyer["id"],
                "name": lawyer["name"],
                "firm": lawyer.get("firm", ""),
                "expertise": lawyer.get("expertise", []),
                "imageUrl": lawyer.get("imageUrl"),
                "status": status,
                "location": lawyer.get("location", "")
            })
    return online

@app.get("/api/public/lawyers/{lawyer_id}")
def get_public_lawyer_detail(lawyer_id: str):
    """Public endpoint for lawyer profile page"""
    lawyer = next((l for l in LAWYERS_DB if l["id"] == lawyer_id), None)
    if not lawyer:
        raise HTTPException(status_code=404, detail="Lawyer not found")
    # Return full public profile data
    return {
        "id": lawyer["id"],
        "name": lawyer["name"],
        "firm": lawyer.get("firm", ""),
        "location": lawyer.get("location", ""),
        "career": lawyer.get("career", ""),
        "education": lawyer.get("education", ""),
        "expertise": lawyer.get("expertise", []),
        "cases": lawyer.get("cases", []),
        "content_items": lawyer.get("content_items", []),
        "imageUrl": lawyer.get("imageUrl"),
        "cutoutImageUrl": lawyer.get("cutoutImageUrl"),
        "phone": lawyer.get("phone"),
        "homepage": lawyer.get("homepage"),
        "kakao_id": lawyer.get("kakao_id"),
        "introduction_short": lawyer.get("introduction_short", ""),
        "introduction_long": lawyer.get("introduction_long", ""),
        "expertise_score": lawyer.get("expertise_score"),
    }

# --- SEO Analysis Endpoints ---
from seo_helper import seo_helper  # type: ignore

class SEOAnalysisRequest(BaseModel):
    title: str
    content: str
    keyword: str

@app.post("/api/seo/analyze")
def analyze_seo(request: SEOAnalysisRequest):
    return seo_helper.analyze_content(request.title, request.content, request.keyword)

@app.get("/api/seo/keywords")
def get_seo_keywords(category: str = Query(..., description="Case category")):
    # Mock keyword database
    keywords = {
        "이혼": ["이혼소송", "재산분할", "양육권", "상간녀위자료", "협의이혼"],
        "형사": ["성범죄", "음주운전", "사기죄", "폭행", "보이스피싱"],
        "부동산": ["전세사기", "명도소송", "보증금반환", "권리금", "임대차계약"],
        "기업": ["법인파산", "횡령", "배임", "계약검토", "노무관리"]
    }
    
    # Return matched list or empty
    for key, values in keywords.items():
        if key in category:
            return {"keywords": values}
            
    return {"keywords": []}

# --- Admin Magazine Management ---

@app.get("/api/admin/magazine/all")
def get_all_magazine_content():
    all_content = []
    for lawyer in LAWYERS_DB:
        for item in lawyer.get("content_items", []):
            try:
                # Calculate source (Lawyer or Admin)
                is_admin_generated = "admin" in item.get("id", "") # Naive check, improve if needed
                source = "Admin Draft" if is_admin_generated else "Lawyer Post"
                
                all_content.append({
                    "id": item.get("id"),
                    "lawyer_id": lawyer["id"],  # type: ignore
                    "lawyer_name": lawyer["name"],  # type: ignore
                    "type": item.get("type", "blog"),
                    "title": item.get("title", "Untitled"),
                    "date": item.get("date", "Unknown"),
                    "verified": item.get("verified", False),
                    "source": source
                })
            except Exception as e:
                print(f"Error parsing item {item.get('id')}: {e}")
                continue
    
    # Sort by date descending
    all_content.sort(key=lambda x: x["date"], reverse=True)
    return all_content

@app.post("/api/admin/content/{item_id}/toggle-visibility")
def toggle_content_visibility(item_id: str):
    for lawyer in LAWYERS_DB:
        for item in lawyer.get("content_items", []):
            if item.get("id") == item_id:
                # Toggle
                current_status = item.get("verified", False)
                item["verified"] = not current_status
                save_lawyers_db(LAWYERS_DB)
                return {"message": "Visibility toggled", "new_status": item["verified"]}
    
    raise HTTPException(status_code=404, detail="Content not found")

@app.delete("/api/admin/content/{item_id}")
def delete_content(item_id: str):
    for lawyer in LAWYERS_DB:
        if "content_items" in lawyer:
            initial_len = len(lawyer["content_items"])
            lawyer["content_items"] = [item for item in lawyer["content_items"] if item.get("id") != item_id]
            
            if len(lawyer["content_items"]) < initial_len:
                save_lawyers_db(LAWYERS_DB)
                return {"message": "Content deleted successfully"}
                
    raise HTTPException(status_code=404, detail="Content not found")

class MagazineCreateRequest(BaseModel):
    title: str
    content: str
    keyword: str
    category: str
    purpose: str
    cover_image: Optional[str] = None
    original_url: Optional[str] = None

@app.post("/api/admin/magazine")
def create_magazine_post(request: MagazineCreateRequest):
    # Default to main lawyer for demo
    target_lawyer_id = "welder49264@naver.com" 
    lawyer = next((l for l in LAWYERS_DB if l["id"] == target_lawyer_id), None)
    
    if not lawyer:
        lawyer = LAWYERS_DB[0] # Fallback

    # Infer topic_tags from category/keyword for recommendation algorithm scoring
    topic_tags = []
    category_tag_map = {
        "가사": ["가사법"], "이혼": ["가사법"], "상속": ["가사법"],
        "형사": ["형사법"], "성범죄": ["형사법"], "교통": ["형사법"],
        "부동산": ["부동산법"], "임대차": ["부동산법"], "전세": ["부동산법"],
        "민사": ["민사법"], "손해배상": ["민사법"], "채권": ["민사법"],
        "행정": ["행정법"], "노동": ["노동법"], "세금": ["조세법"],
        "의료": ["의료법"], "기업": ["민사법"],
    }
    for kw, tags in category_tag_map.items():
        if kw in request.category or kw in request.keyword:
            topic_tags.extend(tags)
    if not topic_tags:
        topic_tags = [request.category]  # Fallback to category itself
        
    new_item = {
        "id": str(uuid4()),
        "type": "column", # Default to column
        "title": request.title,
        "content": request.content,
        "content_markdown": request.content,
        "tags": [request.keyword],
        "topic_tags": topic_tags,  # For recommendation algorithm scoring
        "category": request.category,
        "purpose": request.purpose,
        "date": datetime.now().strftime("%Y-%m-%d"),
        "view_count": 0,
        "cover_image": request.cover_image or "/images/pattern_1.jpg", 
        "original_url": request.original_url or "",
        "summary": request.content[:200] + "...",  # type: ignore
        "slug": request.title.replace(" ", "-"),
        "verified": True,
        "seo": {
            "target_keyword": request.keyword,
            "purpose": request.purpose,
            "schema": seo_helper.generate_schema({
                "title": request.title, 
                "date": datetime.now().strftime("%Y-%m-%d"),
                "lawyer_name": lawyer["name"]  # type: ignore
            })
        }
    }
    
    if "content_items" not in lawyer:  # type: ignore
        lawyer["content_items"] = []  # type: ignore
        
    lawyer["content_items"].insert(0, new_item)  # type: ignore
    save_lawyers_db(LAWYERS_DB)
    
    # 검색 인덱스에 즉시 추가 (변호사 추천 알고리즘 점수 반영)
    try:
        from search import search_engine  # type: ignore
        text = f"{new_item['title']} {new_item['summary']}"
        embedding = search_engine._get_embedding(text)
        import numpy as np  # type: ignore
        if len(search_engine.corpus_embeddings) > 0:
            search_engine.corpus_embeddings = np.vstack([search_engine.corpus_embeddings, embedding])
        else:
            search_engine.corpus_embeddings = np.array([embedding])
        content_idx = len(lawyer["content_items"]) - 1  # type: ignore
        search_engine.mapping.append({"lawyer_id": lawyer["id"], "type": "content", "index": 0})  # type: ignore
        print(f"✅ 블로그/매거진 콘텐츠가 추천 알고리즘 인덱스에 추가됨: {new_item['title']}")
    except Exception as e:
        print(f"⚠️ 인덱스 업데이트 실패 (추후 재시작 시 반영): {e}")
    
    return {"message": "Post created successfully", "id": new_item["id"]}

@app.get("/api/stats/monthly")
def get_monthly_stats():
    now = datetime.now()
    month_ago = now - timedelta(days=30)
    two_months_ago = month_ago - timedelta(days=30)

    # 1. Cases (Content Items type='case')
    # Filter all cases from all lawyers
    all_cases = []
    for lawyer in LAWYERS_DB:
        for item in lawyer.get("content_items", []):
            if item.get("type") == "case":
                all_cases.append(item)

    # Current Period (Last 30d)
    current_cases = [c for c in all_cases if c.get("date") and c.get("date") >= month_ago.strftime("%Y-%m-%d")]
    # Previous Period (30d-60d ago)
    prev_cases = [c for c in all_cases if (c.get("date") and two_months_ago.strftime("%Y-%m-%d") <= c.get("date") < month_ago.strftime("%Y-%m-%d"))]

    # Group by Category (topic_tags[0])
    case_stats = {}
    for c in current_cases:
        tag = c.get("topic_tags", ["기타"])[0]
        case_stats[tag] = case_stats.get(tag, 0) + 1
    
    # Sort and take top 5
    top_case_categories = sorted(case_stats.items(), key=lambda x: x[1], reverse=True)[:5]  # type: ignore
    
    # Calculate Growth
    case_growth = {} # tag -> growth_rate
    for tag, count in top_case_categories:
        prev_count = len([c for c in prev_cases if c.get("topic_tags", ["기타"])[0] == tag])
        if prev_count == 0:
            growth = 100 if count > 0 else 0
        else:
            growth = ((count - prev_count) / prev_count) * 100
        case_growth[tag] = round(growth, 1)


    # 2. Consultations
    current_consults = [c for c in CONSULTATIONS_DB if c.get("created_at") and c.get("created_at") >= month_ago.strftime("%Y-%m-%d")]
    prev_consults = [c for c in CONSULTATIONS_DB if c.get("created_at") and two_months_ago.strftime("%Y-%m-%d") <= c.get("created_at") < month_ago.strftime("%Y-%m-%d")]

    consult_stats = {}
    for c in current_consults:
        area = c.get("primary_area", "기타")
        consult_stats[area] = consult_stats.get(area, 0) + 1
        
    top_consult_categories = sorted(consult_stats.items(), key=lambda x: x[1], reverse=True)[:5]  # type: ignore

    consult_growth = {}
    for area, count in top_consult_categories:
        prev_count = len([c for c in prev_consults if c.get("primary_area") == area])
        if prev_count == 0:
            growth = 100 if count > 0 else 0
        else:
            growth = ((count - prev_count) / prev_count) * 100
        consult_growth[area] = round(growth, 1)

    # 3. Market Demand (Case Count / Active Lawyer Count)
    # Active Lawyer: last_login within 30d OR verified=True
    active_lawyers = [l for l in LAWYERS_DB if l.get("verified") or (l.get("last_login") and l.get("last_login") >= month_ago.strftime("%Y-%m-%d"))]
    
    # Group active lawyers by expertise (primary)
    lawyer_stats = {}
    for l in active_lawyers:
        # Simplification: Use first expertise as primary
        expertise = l.get("expertise", ["기타"])[0]
        lawyer_stats[expertise] = lawyer_stats.get(expertise, 0) + 1

    # Calculate Demand Ratio for all categories present in cases
    demand_stats = []
    
    all_categories = set(case_stats.keys()) | set(lawyer_stats.keys())
    
    for cat in all_categories:
        case_count = case_stats.get(cat, 0)
        lawyer_count = lawyer_stats.get(cat, 0)
        
        ratio = case_count / lawyer_count if lawyer_count > 0 else case_count # If no lawyers, ratio matches case count (high demand)
        
        # Prev ratio (approximate)
        prev_case_count = len([c for c in prev_cases if c.get("topic_tags", ["기타"])[0] == cat])
        # Assume lawyer count was similar (simplification for mock data)
        prev_ratio = prev_case_count / lawyer_count if lawyer_count > 0 else prev_case_count
        
        growth = ((ratio - prev_ratio) / prev_ratio * 100) if prev_ratio > 0 else (100 if ratio > 0 else 0)

        demand_stats.append({
            "category": cat,
            "case_count": case_count,
            "lawyer_count": lawyer_count,
            "ratio": round(ratio, 2),  # type: ignore
            "growth": round(growth, 1)  # type: ignore
        })
        
    # Sort by ratio descending
    demand_stats.sort(key=lambda x: x["ratio"], reverse=True)

    return {
        "cases": {
            "top_categories": [{"name": k, "value": v, "growth": case_growth[k]} for k, v in top_case_categories]
        },
        "consultations": {
            "top_categories": [{"name": k, "value": v, "growth": consult_growth[k]} for k, v in top_consult_categories]
        },
        "demand": demand_stats[:10] # Top 10  # type: ignore
    }

from pdf_utils import extract_text_from_pdf  # type: ignore
from pii_utils import mask_pii  # type: ignore
import shutil

# ... existing imports ...

# --- Case/Magazine Automation ---

class CaseSummaryRequest(BaseModel):
    lawyer_id: str
    overview: str
    issues: str
    strategy: str
    result: str
    points: str
    tips: Optional[str] = None

@app.post("/api/cases/upload_pdf")
async def upload_case_pdf(lawyer_id: str = Form(...), file: UploadFile = File(...)):
    # 1. Save File
    upload_dir = f"uploads/cases/{lawyer_id}"
    os.makedirs(upload_dir, exist_ok=True)
    
    file_id = str(uuid4())
    ext = os.path.splitext(file.filename)[1]
    file_path = f"{upload_dir}/{file_id}{ext}"
    
    with open(file_path, "wb") as buffer:
        content = await file.read()
        buffer.write(content)
        
    # 2. Extract Text
    text, is_scanned = extract_text_from_pdf(content)
    
    if is_scanned:
        return {
            "success": False,
            "message": "텍스트 추출 실패 (스캔본 또는 이미지)",
            "is_scanned": True,
            "file_id": file_id
        }
        
    # 3. Mask PII
    masked_text = mask_pii(text)
    
    # 4. Generate Draft with LLM
    from consultation import analyze_judgment  # type: ignore
    
    # We pass the ORIGINAL text to the LLM so it can identify names (e.g. "Kim Soo-yeon") 
    # and anonymize them stylistically (e.g. "Kim C") as per the prompt instructions.
    analysis = analyze_judgment(text)
    
    # Auto-generate Image
    import urllib.parse
    prompt = f"legal document, case file, {analysis.get('result', 'justice')}, cinematic, warm lighting"
    encoded = urllib.parse.quote(prompt)
    image_url = f"https://image.pollinations.ai/prompt/{encoded}?width=800&height=600&nologo=true"

    draft = {
        "id": f"draft_{uuid4()}",
        "type": "case",
        "title": f"성공 사례: {file.filename} (AI 분석)",
        "content": f"""
<h3>1. 사건 개요</h3>
<p>{analysis.get('overview', '내용을 분석하지 못했습니다.')}</p>
<h3>2. 주요 쟁점</h3>
<p>{analysis.get('issues', '내용을 분석하지 못했습니다.')}</p>
<h3>3. 변호사의 조력 (대응 전략)</h3>
<p>{analysis.get('strategy', '내용을 분석하지 못했습니다.')}</p>
<h3>4. 결과</h3>
<p>{analysis.get('result', '내용을 분석하지 못했습니다.')}</p>
<h3>5. 판결/결정 포인트</h3>
<p>{analysis.get('points', '내용을 분석하지 못했습니다.')}</p>
<hr>
<p class="text-xs text-gray-500">* 본 게시물은 AI가 판결문을 분석하여 작성한 초안입니다. 정확한 내용은 반드시 원문과 대조하여 검토해주시기 바랍니다.</p>
""",
        "summary": analysis.get('overview', '')[:100] + "...",
        "topic_tags": ["AI생성", "승소사례", analysis.get('result', '승소')],
        "verified": False,
        "date": datetime.now().strftime("%Y-%m-%d"),
        "url": None,
        "status": "draft",
        "lawyer_id": lawyer_id,
        "original_file": file_path,
        "image": image_url # Store generated image
    }
    
    # Save to DB
    lawyer = next((l for l in LAWYERS_DB if l["id"] == lawyer_id), None)
    if lawyer:
        lawyer["content_items"].insert(0, draft) # Add to top
        save_db()
        
    return {
        "success": True,
        "message": "초안 생성 완료",
        "draft": draft
    }

@app.post("/api/cases/create_from_summary")
def create_case_draft(request: CaseSummaryRequest):
    draft_content = f"""
<h3>1. 사건 개요</h3>
<p>{request.overview}</p>
<h3>2. 주요 쟁점</h3>
<p>{request.issues}</p>
<h3>3. 변호사의 조력</h3>
<p>{request.strategy}</p>
<h3>4. 결과</h3>
<p>{request.result}</p>
<h3>5. 판결/결정 포인트</h3>
<p>{request.points}</p>
"""
    if request.tips:
        draft_content += f"<h3>6. 실무 팁</h3><p>{request.tips}</p>"
        
    draft_content += """
<hr>
<p class="text-xs text-gray-500">* 변호사가 직접 입력한 핵심 요약을 바탕으로 생성된 게시물입니다.</p>
"""

    # Auto-generate Image
    import urllib.parse
    prompt = f"legal victory, gavel, court, {request.result}, cinematic"
    encoded = urllib.parse.quote(prompt)
    image_url = f"https://image.pollinations.ai/prompt/{encoded}?width=800&height=600&nologo=true"

    draft = {
        "id": f"draft_{uuid4()}",
        "type": "case",
        "title": "승소 사례 (제목을 입력하세요)",
        "content": draft_content,
        "summary": request.overview[:100] + "...",  # type: ignore
        "topic_tags": ["승소사례"],
        "verified": False,
        "date": datetime.now().strftime("%Y-%m-%d"),
        "url": None,
        "status": "draft",
        "lawyer_id": request.lawyer_id,
        "image": image_url # Store generated image
    }
    
    lawyer = next((l for l in LAWYERS_DB if l["id"] == request.lawyer_id), None)
    if lawyer:
        lawyer["content_items"].insert(0, draft)
        save_db()
        
    return {
        "success": True,
        "message": "초안 저장 완료",
        "draft": draft
    }


# --- Consultation CRM System ---
from consultation import analyze_consultation_text  # type: ignore

class ConsultationModel(BaseModel):
    id: str
    lawyer_id: str
    created_at: str
    updated_at: str
    original_text: str
    
    # Analysis Results (Flattened for simplicity or nested)
    case_title: str
    primary_area: str
    confidence: float
    summary: str
    key_facts: List[str]
    key_issues: List[str]
    missing_questions: List[str]
    checklist: List[str]
    risk_notes: List[str]
    next_steps: List[str]
    
    # Management
    status: str # new, reviewing, waiting_client, proceeding, closed
    tags: List[str]
    notes: Optional[str] = None
    links: List[str] = []
    chat_client_id: Optional[str] = None # Added for chat integration

class ConsultationCreateRequest(BaseModel):
    text: str
    lawyer_id: str
    chat_client_id: Optional[str] = None # Added for chat integration

class ActionSuggestion(BaseModel):
    id: str
    title: str
    description: str
    priority: int # 1 (High) to 3 (Low)
    cta_label: str
    cta_link: str
    icon: str # emoji or icon name

CONSULTATIONS_DB = sb_load_all("consultations") or []
print(f"📊 상담 복원 (Supabase): {len(CONSULTATIONS_DB)}건")

@app.post("/api/consultations", response_model=ConsultationModel)
async def create_consultation(request: ConsultationCreateRequest):
    # Analyze text
    print(f"Creating consultation for lawyer {request.lawyer_id} with chat_id {request.chat_client_id}")
    analysis = analyze_consultation_text(request.text)
    
    consultation = {
        "id": str(uuid4()),
        "lawyer_id": request.lawyer_id,
        "created_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "updated_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "original_text": request.text,
        **analysis, # Spread analysis results
        "status": "new",
        "tags": [],
        "notes": "",
        "links": [],
        "chat_client_id": request.chat_client_id # Store chat ID
    }
    
    CONSULTATIONS_DB.append(consultation)
    sb_append("consultations", consultation)

    # --- Send Notification to Dashboard via Chat Server (IPC) ---
    try:
        import websockets  # type: ignore
        # Connect as a system user to trigger the notification broadcast
        chat_ws_url = f"ws://127.0.0.1:8003/ws/chat/{request.lawyer_id}/consultation_system/user"
        async with websockets.connect(chat_ws_url) as websocket:
            notification_text = f"새로운 상담 신청이 도착했습니다: {analysis.get('case_title', '제목 없음')}"
            await websocket.send(notification_text)
            print(f"Notification sent to chat server for {request.lawyer_id}")
    except Exception as e:
        print(f"Failed to send consultation notification via WS: {e}")

    return consultation

@app.get("/api/consultations", response_model=List[ConsultationModel])
def get_consultations(
    lawyer_id: str, 
    status: Optional[str] = None, 
    area: Optional[str] = None, 
    search: Optional[str] = None
):
    results = [c for c in CONSULTATIONS_DB if c["lawyer_id"] == lawyer_id]
    
    if status:
        results = [c for c in results if c["status"] == status]
    if area:
        results = [c for c in results if c["primary_area"] == area]
    if search:
        s = search.lower()
        results = [c for c in results if s in c["case_title"].lower() or s in c["summary"].lower()]
        
    # Sort by updated_at desc
    results.sort(key=lambda x: x["updated_at"], reverse=True)
    return results

@app.get("/api/consultations/{id}", response_model=ConsultationModel)
def get_consultation_detail(id: str):
    consultation = next((c for c in CONSULTATIONS_DB if c["id"] == id), None)
    if not consultation:
        raise HTTPException(status_code=404, detail="상담 내역을 찾을 수 없습니다.")
    return consultation

class ConsultationUpdateRequest(BaseModel):
    status: Optional[str] = None
    tags: Optional[List[str]] = None
    notes: Optional[str] = None

@app.patch("/api/consultations/{id}", response_model=ConsultationModel)
def update_consultation(id: str, request: ConsultationUpdateRequest):
    consultation = next((c for c in CONSULTATIONS_DB if c["id"] == id), None)
    if not consultation:
        raise HTTPException(status_code=404, detail="상담 내역을 찾을 수 없습니다.")
        
    if request.status:
        consultation["status"] = request.status
    if request.tags is not None:
        consultation["tags"] = request.tags
    if request.notes is not None:
        consultation["notes"] = request.notes
        
    consultation["updated_at"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    return consultation

@app.get("/api/dashboard/actions", response_model=List[ActionSuggestion])
def get_dashboard_actions(lawyer_id: str):
    # Rule-based suggestions
    suggestions = []
    
    # 1. Check profile completeness (Mock logic)
    lawyer = next((l for l in LAWYERS_DB if l["id"] == lawyer_id), None)
    if lawyer:
        if not lawyer.get("imageUrl"):
             suggestions.append({
                "id": "profile_photo",
                "title": "선생님의 신뢰도를 높여보세요",
                "description": "프로필 사진이 비어있습니다. 전문적인 사진을 등록하면 상담 요청이 30% 증가합니다.",
                "priority": 1,
                "cta_label": "사진 등록하기",
                "cta_link": "/lawyer/profile/edit",
                "icon": "📸"
            })
        if not lawyer.get("career") or len(lawyer.get("career", "")) < 10:
             suggestions.append({
                "id": "profile_career",
                "title": "상세 경력을 업데이트하세요",
                "description": "의뢰인들은 상세한 경력을 확인하고 싶어합니다.",
                "priority": 2,
                "cta_label": "경력 추가",
                "cta_link": "/lawyer/profile/edit",
                "icon": "v"
            })
            
    # 2. Check recent content
    # Check if lawyer has any 'case' content in the last 30 days
    has_recent_case = False
    if lawyer.get("content_items"):  # type: ignore
        # Check if any item is type 'case'
        # Simple check: just check if they have ANY case for now to stop the annoyance
        has_recent_case = any(item.get("type") == "case" for item in lawyer["content_items"])  # type: ignore
        
    if not has_recent_case:
        suggestions.append({
            "id": "write_case",
            "title": "가사 분야 문의가 급증하고 있습니다",
            "description": "최근 7일간 가사 분야 검색이 15% 늘었습니다. 관련 승소사례를 등록해보세요.",
            "priority": 2,
            "cta_label": "승소사례 등록하기",
            "cta_link": "/lawyer/dashboard/cases/upload",
            "icon": "📈"
        })

    # 3. Check consultation updates
    # Mock: Check if any consultation is 'new' for > 3 days
    stale_consultations = [c for c in CONSULTATIONS_DB if c["lawyer_id"] == lawyer_id and c["status"] == "new"]
    if len(stale_consultations) > 0:
        suggestions.append({
             "id": "review_consultation",
             "title": "확인하지 않은 상담이 있습니다",
             "description": f"{len(stale_consultations)}건의 신규 상담이 분석되었습니다. 검토 후 전략을 수립하세요.",
             "priority": 1,
             "cta_label": "상담 검토하기",
             "cta_link": "/lawyer/consultations",
             "icon": "bell"
        })

    return suggestions[:3] # Return top 3  # type: ignore

# Configure CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# StaticFiles removed for Vercel serverless (no filesystem access)

DB_FILE = "lawyers_db.json"


class CaseModel(BaseModel):
    title: str
    summary: str

class ContentItem(BaseModel):
    id: str
    type: str # blog, column, book, lecture
    title: str
    topic_tags: List[str]
    verified: bool
    date: Optional[str] = None
    url: Optional[str] = None
    source: Optional[str] = None # admin_injected, user_submission, etc.
    summary: Optional[str] = None # Added summary field
    slug: Optional[str] = None
    seo_title: Optional[str] = None
    seo_description: Optional[str] = None
    emotional_title: Optional[str] = None # New field for magazine
    emotional_summary: Optional[str] = None # New field for magazine


class BlogTheme(BaseModel):
    primaryColor: Optional[str] = None
    secondaryColor: Optional[str] = None
    accentColor: Optional[str] = None

class BlogContent(BaseModel):
    hero_description: Optional[str] = None
    consultation_title: Optional[str] = None
    consultation_message: Optional[str] = None

class LawyerModel(BaseModel):
    id: str
    name: str
    firm: str
    location: str
    career: str
    education: Optional[str] = None
    careerTags: List[str] = []
    gender: Optional[str] = None
    expertise: List[str]
    matchScore: float = 0.0
    bestCase: Optional[CaseModel] = None
    bestContent: Optional[ContentItem] = None # Added for magazine integration
    imageUrl: Optional[str] = None # Original URL (internal use or admin)
    cutoutImageUrl: Optional[str] = None # Processed transparent PNG
    bgRemoveStatus: str = "pending" # pending, processed, failed
    content_items: List[ContentItem] = []
    content_highlights: Optional[str] = None # Summary string for UI
    phone: Optional[str] = None
    homepage: Optional[str] = None
    kakao_id: Optional[str] = None
    verified: bool = True # Default to True for now (legacy data)
    introduction_short: Optional[str] = None # One-line tagline
    introduction_long: Optional[str] = None # Detailed bio
    blog_theme: Optional[BlogTheme] = None
    blog_content: Optional[BlogContent] = None
    # --- Subscription Fields ---
    is_subscribed: bool = False
    is_founder: bool = False
    trial_ends_at: Optional[str] = None
    billing_key: Optional[str] = None
    subscription_plan: Optional[str] = None
    licenseImageUrl: Optional[str] = None
    licenseId: Optional[str] = None
    is_mock: bool = False

class CaseAnalysisDetails(BaseModel):
    case_nature: str
    category: str # e.g. "형사 > 성범죄", "가사 > 이혼"
    core_risk: str # Biggest risk factor
    time_strategy: str # "Golden time is now", "Secure evidence first", etc.
    urgency: str # "High", "Medium", "Low"
    procedure: str
    necessity_score: int
    cost_range: str
    
    # New Briefing Fields
    one_line_summary: str # "배우자의 부정행위 증거가 명확하여 위자료 3천만원 청구가 가능한 사안입니다."
    key_issues: List[str] # ["재산분할 기여도 입증", "양육권 지정 유리", "상간자 소송 병행 여부"]
    action_checklist: List[str] # ["통화 녹음 및 카카오톡 대화 내용 백업", "카드 사용 내역서 확보", "전문가 상담 예약"]

class RecommendationResponse(BaseModel):
    lawyers: List[LawyerModel]
    analysis: str
    analysis_details: Optional[CaseAnalysisDetails] = None

@app.get("/")
def read_root():
    return {"message": "Lawnald API is running"}

@app.get("/api/recommend", response_model=RecommendationResponse)
def recommend_lawyers(
    q: str = Query(..., min_length=1), 
    location: Optional[str] = Query(None),
    gender: Optional[str] = Query(None),
    education: Optional[str] = Query(None),
    career: Optional[str] = Query(None)
):
    results = search_engine.search(q, location=location, gender=gender, education=education, career=career)
    return results

@app.post("/api/lawyers/{lawyer_id}/upload-photo")
async def upload_lawyer_photo(lawyer_id: str, file: UploadFile = File(...)):
    # 1. Find the lawyer
    lawyer = next((l for l in LAWYERS_DB if l["id"] == lawyer_id), None)
    if not lawyer:
        raise HTTPException(status_code=404, detail="Lawyer not found")

    # 2. Validate file (simple check)
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    # 3. Save original — now uploads to Supabase Storage
    filename = f"{lawyer_id}_{file.filename}"
    photo_url = await image_utils.save_upload_file(file, filename)
    
    # Update DB — use Supabase Storage URL (persists across deployments)
    lawyer["imageUrl"] = photo_url
    lawyer["cutoutImageUrl"] = photo_url  # Use original as cutout
    lawyer["bgRemoveStatus"] = "skipped"
    
    save_db()
    
    return {
        "message": "Photo uploaded successfully", 
        "cutoutImageUrl": photo_url,
        "status": "processed"
    }

# --- Content Submission & Admin System ---

class ContentSubmission(BaseModel):
    id: str
    lawyer_id: str
    type: str # blog, column, book, lecture
    title: str
    summary: str
    content: str # Full content or link
    topic_tags: List[str]
    status: str = "pending" # pending, approved, rejected
    date: str
    file_url: Optional[str] = None # PDF file URL or Image URL
    career: Optional[str] = None
    education: Optional[str] = None

SUBMISSIONS_DB = sb_load_all("submissions") or []
print(f"📊 콘텐츠 제출 복원 (Supabase): {len(SUBMISSIONS_DB)}건")

@app.post("/api/lawyers/{lawyer_id}/submit")
async def submit_content(
    lawyer_id: str,
    type: str = Form(...),
    title: str = Form(None),
    summary: str = Form(None),
    content: str = Form(None),
    topic_tags: str = Form(None), 
    career: str = Form(None),
    education: str = Form(None),
    file: Optional[UploadFile] = File(None)
):
    # Verify lawyer exists
    lawyer = next((l for l in LAWYERS_DB if l["id"] == lawyer_id), None)
    if not lawyer:
        raise HTTPException(status_code=404, detail="Lawyer not found")

    import uuid
    from datetime import datetime
    
    file_url = None
    if file:
        try:
            filename = f"{uuid.uuid4()}_{file.filename}"
            # Ensure safe filename
            import re
            filename = re.sub(r'[^a-zA-Z0-9_.-]', '', filename)
            
            # Upload to Supabase Storage
            file_bytes = await file.read()
            try:
                from storage_utils import upload_and_get_url  # type: ignore
                sb_url = upload_and_get_url("cases", filename, file_bytes, file.content_type or "application/octet-stream")
                if sb_url:
                    file_url = sb_url
            except Exception:
                pass
            
            # Fallback: save to /tmp
            if not file_url:
                os.makedirs("/tmp/documents", exist_ok=True)
                file_path = f"/tmp/documents/{filename}"
                with open(file_path, "wb") as buffer:
                    buffer.write(file_bytes)
                file_url = f"/uploads/documents/{filename}"
        except Exception as e:
            print(f"File upload failed: {e}")
            raise HTTPException(status_code=500, detail="File upload failed")

    tags_list = [t.strip() for t in topic_tags.split(",") if t.strip()] if topic_tags else []

    submission = {
        "id": str(uuid.uuid4()),
        "lawyer_id": lawyer_id,
        "lawyer_name": lawyer["name"],
        "type": type,
        "title": title or "Profile Update",
        "summary": summary or "",
        "content": content or "",
        "topic_tags": tags_list,
        "status": "approved", # Auto-approve for demo
        "date": datetime.now().strftime("%Y-%m-%d"),
        "file_url": file_url,
        "career": career,
        "education": education
    }
    
    SUBMISSIONS_DB.append(submission)
    sb_append("submissions", submission)

    # Auto-add to lawyer's content_items for Magazine visibility
    if type in ["column", "blog", "case"]:
        slug = seo.SEOGenerator.generate_slug(submission["title"])
        seo_title = seo.SEOGenerator.generate_seo_title(submission["title"], lawyer["name"], type)
        seo_desc = seo.SEOGenerator.generate_meta_description(submission["content"], submission["summary"])

        new_content_item = {
            "id": submission["id"],
            "type": "case" if type == "case" else "column", # Normalize type
            "title": submission["title"],
            "slug": slug,
            "seo_title": seo_title,
            "seo_description": seo_desc,
            "topic_tags": tags_list,
            "verified": True, # Auto-verify
            "date": submission["date"],
            "url": None, # Internal content
            "content": submission["content"] # Store content for magazine detail
        }
        if "content_items" not in lawyer:
            lawyer["content_items"] = []
        lawyer["content_items"].append(new_content_item)
        save_db() # Persist changes

    return {"message": "Submission received and published", "id": submission["id"]}

@app.get("/api/lawyers/{lawyer_id}/blog")
def get_lawyer_blog_posts(lawyer_id: str):
    lawyer = next((l for l in LAWYERS_DB if l["id"] == lawyer_id), None)
    if not lawyer:
        raise HTTPException(status_code=404, detail="Lawyer not found")
        
    posts = [item for item in lawyer.get("content_items", []) if item.get("type") in ["blog", "column", "case"]]
    # Sort by date desc
    posts.sort(key=lambda x: x.get("date", ""), reverse=True)
    return posts

@app.get("/api/lawyers/{lawyer_id}/blog/{slug}")
def get_lawyer_blog_post_detail(lawyer_id: str, slug: str):
    lawyer = next((l for l in LAWYERS_DB if l["id"] == lawyer_id), None)
    if not lawyer:
        raise HTTPException(status_code=404, detail="Lawyer not found")
        
    # Match by slug
    post = next((item for item in lawyer.get("content_items", []) if item.get("slug") == slug), None)
    
    # Fallback to ID match if slug not found (for legacy compatibility or if slug is actually an ID)
    if not post:
        post = next((item for item in lawyer.get("content_items", []) if item.get("id") == slug), None)
        
    if not post:
        raise HTTPException(status_code=404, detail="Blog post not found")
        
    return post

@app.get("/api/admin/submissions_legacy")
def get_submissions_legacy(status: str = "pending"):
    return [s for s in SUBMISSIONS_DB if s["status"] == status]

@app.post("/api/admin/submissions_legacy/{submission_id}/approve")
def approve_submission_legacy(submission_id: str):
    submission = next((s for s in SUBMISSIONS_DB if s["id"] == submission_id), None)
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")
        
    submission["status"] = "approved"
    
    lawyer = next((l for l in LAWYERS_DB if l["id"] == submission["lawyer_id"]), None)
    if not lawyer:
        return {"message": "Approved, but lawyer not found"}

    if submission["type"] == "profile_update":
        # Update Profile Info
        if submission.get("career"):
            lawyer["career"] = submission["career"]
        if submission.get("education"):
            lawyer["education"] = submission["education"]
        if submission.get("file_url"):
            # If it's a photo update, we update the cutoutImageUrl directly for now
            # (In a real app, we might run bg removal here again or trust the user upload)
            lawyer["cutoutImageUrl"] = submission["file_url"]
            lawyer["imageUrl"] = submission["file_url"]
    else:
        # Add Content Item
        new_content = {
            "id": submission["id"],
            "type": submission["type"],
            "title": submission["title"],
            "topic_tags": submission["topic_tags"],
            "verified": True,
            "date": submission["date"],
            # Fix NoneType error: check if content exists before startswith
            "url": submission.get("url") or submission.get("file_url") or (submission["content"] if submission["content"] and submission["content"].startswith("http") else None)  # type: ignore
        }
        lawyer["content_items"].insert(0, new_content) # Add to top
        
        # Update Content Highlights
        count = len([c for c in lawyer["content_items"] if c["verified"]])
        lawyer["content_highlights"] = f"관련 전문 콘텐츠 {count}건 (검증됨)"
        
    return {"message": "Approved", "submission": submission}

@app.post("/api/admin/submissions_legacy/{submission_id}/reject")
def reject_submission_legacy(submission_id: str):
    submission = next((s for s in SUBMISSIONS_DB if s["id"] == submission_id), None)
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")
        
    submission["status"] = "rejected"
    return {"message": "Rejected", "submission": submission}

# --- Direct Content Injection (Admin) ---

class InjectContentRequest(BaseModel):
    type: str # book, case, column
    count: int

@app.post("/api/admin/lawyers/{lawyer_id}/content/inject")
def inject_content(lawyer_id: str, request: InjectContentRequest):
    lawyer = next((l for l in LAWYERS_DB if l["id"] == lawyer_id), None)
    if not lawyer:
        raise HTTPException(status_code=404, detail="Lawyer not found")
    
    import uuid
    from datetime import datetime
    
    added_items = []
    
    import random
    from data_templates import REALISTIC_CASE_TITLES, get_all_case_titles  # type: ignore
    
    titles_map = {
        "book": ["법률 가이드북", "소송의 정석", "생활 법률 상식", "전문가의 조언"],
        "column": ["전세사기 예방 칼럼", "상속세 절세 가이드", "교통사고 대처법", "기업 법무 동향"]
    }
    
    for i in range(request.count):
        if request.type == "case":
            # Pick a random category then a random title for better variety
            category = random.choice(list(REALISTIC_CASE_TITLES.keys()))
            title_base = random.choice(REALISTIC_CASE_TITLES[category])
        else:
            title_base = random.choice(titles_map.get(request.type, ["전문 콘텐츠"]))
            
        item = {
            "id": f"inject_{uuid.uuid4()}",
            "type": request.type,
            "title": title_base,
            "topic_tags": ["전문분야", "법률상담", "승소사례"],
            "verified": True,
            "date": datetime.now().strftime("%Y-%m-%d"),
            "url": None,
            "source": "admin_injected" # Flag to hide from magazine
        }
        lawyer["content_items"].append(item)
        added_items.append(item)
        
    # Update Highlights
    count = len([c for c in lawyer["content_items"] if c["verified"]])
    lawyer["content_highlights"] = f"관련 전문 콘텐츠 {count}건 (검증됨)"
    
    return {
        "message": f"Successfully injected {request.count} {request.type} items",
        "current_total": count,
        "lawyer_name": lawyer["name"]
    }

# --- Persistence Utils ---


def load_db():
    if os.path.exists(DB_FILE):
        try:
            with open(DB_FILE, "r", encoding="utf-8") as f:
                loaded_data = json.load(f)
                LAWYERS_DB.clear()
                LAWYERS_DB.extend(loaded_data)
            print(f"Loaded {len(LAWYERS_DB)} lawyers from {DB_FILE}")
        except Exception as e:
            print(f"Failed to load DB: {e}. Using initial mock data.")
    else:
        print("No DB file found. Using initial mock data.")
        save_db()

def save_db():
    save_lawyers_db(LAWYERS_DB)


# Initialize DB on startup (module level)
load_db()

# Initialize Search Engine (Load/Generate Embeddings)
try:
    print("Initializing Search Engine...")
    search_engine.load_index() # Use load_index to use cache if available
except Exception as e:
    print(f"Failed to initialize search engine: {e}")

# --- Authentication & Signup ---

@app.post("/api/auth/signup/lawyer")
async def signup_lawyer(
    name: str = Form(...),
    email: str = Form(...),
    password: str = Form(...),
    licenseId: str = Form(...),
    firm: str = Form(...),
    phone: str = Form(...),
    licenseImage: UploadFile = File(...)
):
    # Check if email exists
    if any(l["id"] == email for l in LAWYERS_DB):
        raise HTTPException(status_code=400, detail="Email already registered")
        
    # Validation: licenseImage must be an image
    if not licenseImage.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="License file must be an image")

    # Save License Image
    import shutil
    upload_dir = "uploads/licenses"
    os.makedirs(upload_dir, exist_ok=True)
    
    file_ext = os.path.splitext(licenseImage.filename)[1]
    filename = f"{email}_license{file_ext}"
    file_path = os.path.join(upload_dir, filename)
    
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(licenseImage.file, buffer)
    except Exception as e:
        print(f"Error saving license image: {e}")
        raise HTTPException(status_code=500, detail="Failed to save license image")
        
    # URL accessible via mounted /uploads path
    license_url = f"/uploads/licenses/{filename}"

    import uuid
    new_lawyer = {
        "id": email, # Use email as ID for simplicity
        "email": email, # Explicitly store email
        "name": name,
        "password": password, # Save password for mock auth
        "firm": firm,
        "location": "서울 (등록 대기)",
        "career": f"변호사 자격증 번호: {licenseId}",
        "education": "",
        "careerTags": ["신규"],
        "gender": "unknown",
        "expertise": ["일반"],
        "matchScore": 0,
        "bestCase": {"title": "등록 대기 중", "summary": "아직 등록된 사례가 없습니다."},
        "imageUrl": "/static/images/default_avatar.png",
        "cutoutImageUrl": "/static/images/default_avatar.png",
        "bgRemoveStatus": "pending",
        "content_items": [],
        "content_highlights": "인증 심사 중",
        "phone": phone,
        "homepage": None,
        "kakao_id": None,
        "verified": False, # New flag for verification
        "is_mock": False, # 실제 가입 변호사
        "licenseId": licenseId,
        "licenseImageUrl": license_url
    }

    # --- 파운딩 멤버 혜택 자동 부여 ---
    try:
        from billing import set_founder_benefits, set_standard_trial, FOUNDER_LIMIT  # type: ignore
    except ImportError:
        from billing import set_founder_benefits, set_standard_trial, FOUNDER_LIMIT  # type: ignore

    if len(LAWYERS_DB) < FOUNDER_LIMIT:
        set_founder_benefits(new_lawyer)
    else:
        set_standard_trial(new_lawyer)
    
    LAWYERS_DB.append(new_lawyer)
    save_lawyers_db(LAWYERS_DB)

    founder_msg = " 🚀 파운딩 멤버로 선정되었습니다! 3개월 무료 + 평생 50% 할인" if new_lawyer.get("is_founder") else ""
    return {"message": f"Signup successful{founder_msg}", "lawyer_id": new_lawyer["id"], "is_founder": new_lawyer.get("is_founder", False)}

class LawyerLoginRequest(BaseModel):
    email: str
    password: str

@app.post("/api/auth/login")
def login_lawyer(request: LawyerLoginRequest):
    # Find lawyer by email (id)
    lawyer = next((l for l in LAWYERS_DB if l["id"] == request.email), None)
    
    if not lawyer:
        raise HTTPException(status_code=400, detail="Invalid email or password")
    
    # Check password (simple verification for mock)
    # Note: Pre-filled mock data from data.py likely doesn't have 'password' field.
    # So we allow login for them if no password field exists (or handle it otherwise).
    # For new signups, we have the password.
    if "password" in lawyer and lawyer["password"] != request.password:
        raise HTTPException(status_code=400, detail="Invalid email or password")
        
    return {
        "message": "Login successful", 
        "lawyer": {
            "id": lawyer["id"],
            "name": lawyer["name"],
            "firm": lawyer["firm"],
            "verified": lawyer.get("verified", True) # Default true for old mocks
        }
    }

# --- Public Lawyer Profile API ---

@app.get("/api/public/lawyers")
def get_public_lawyers():
    """Get list of all lawyers (simplified) for sitemap/directory"""
    return [
        {
            "id": l["id"],
            "name": l["name"],
            "content_items": [
                {
                    "id": c["id"],
                    "slug": c.get("slug", c["id"]),
                    "date": c.get("date", ""),
                    "type": c.get("type", "blog")
                } for c in l.get("content_items", []) if c.get("verified")
            ]
        }
        for l in LAWYERS_DB
    ]

@app.get("/api/public/lawyers/{lawyer_id}")
def get_public_lawyer_detail(lawyer_id: str):
    lawyer = next((l for l in LAWYERS_DB if l["id"] == lawyer_id), None)
    if not lawyer:
        raise HTTPException(status_code=404, detail="Lawyer not found")
    
    # Return full details for public profile
    return {
        "id": lawyer["id"],
        "name": lawyer["name"],
        "firm": lawyer["firm"],
        "location": lawyer["location"],
        "career": lawyer["career"],
        "education": lawyer["education"],
        "expertise": lawyer["expertise"],
        "imageUrl": lawyer.get("imageUrl"),
        "cutoutImageUrl": lawyer.get("cutoutImageUrl"),
        "phone": lawyer.get("phone"),
        "homepage": lawyer.get("homepage"),
        "kakao_id": lawyer.get("kakao_id"),
        "introduction_short": lawyer.get("introduction_short"),
        "introduction_long": lawyer.get("introduction_long"),
        "content_items": [item for item in lawyer.get("content_items", []) if item.get("verified")],
        "cases": lawyer.get("cases", [])
    }

# --- Legal Magazine API ---

@app.get("/api/magazine")
def get_magazine_articles():
    import urllib.parse
    
    def generate_ai_image_url(prompt: str) -> str:
        """Generate a dynamic AI image URL using pollinations.ai"""
        # Ignore input prompt (which might be Korean/complex) and use safe presets
        import random
        safe_prompts = [
            "lawyer working at desk, professional, cinematic, 4k",
            "supreme court building, architecture, dramatic sky",
            "legal documents, pen, closeup, detailed",
            "judge gavel, wooden, blurred background, high quality",
            "statue of lady justice, silhouette, sunset"
        ]
        chosen_prompt = random.choice(safe_prompts)
        encoded = urllib.parse.quote(chosen_prompt)
        return f"https://image.pollinations.ai/prompt/{encoded}?width=800&height=600&nologo=true"

    # Gather all verified content from all lawyers
    articles = []
    
    # 1. From LAWYERS_DB (Verified content)
    for lawyer in LAWYERS_DB:
        for item in lawyer.get("content_items", []):
            # Filter out admin injected content
            # Filter out admin injected content AND 'youtube' type (Score-only)
            if item.get("verified") and item.get("type") in ["column", "case"] and item.get("source") != "admin_injected":
                
                # Ensure cover image exists
                cover_image = item.get("image")
                if not cover_image and not item.get("file_url"):
                    # Generate one on the fly if missing (and persist it optionally, but here just return dynamic)
                    # For performance, we should persist, but for now let's just generate URL.
                    # Best to stick to what's in DB, but if DB is empty, provide dynamic one.
                    cover_image = generate_ai_image_url(item["title"])
                
                articles.append({
                    "id": item["id"],
                    "lawyer_id": lawyer["id"],  # type: ignore
                    "lawyer_name": lawyer["name"],  # type: ignore
                    "lawyer_firm": lawyer.get("firm", "Lawnald Partner"),
                    "lawyer_firm": lawyer.get("firm", "Lawnald Partner"),
                    "lawyer_image": lawyer.get("cutoutImageUrl") or lawyer.get("imageUrl"), # Frontend handles null with default icon
                    "type": item["type"],
                    "type": item["type"],
                    "title": item["title"],
                    "summary": item.get("content", "")[:100] + "..." if item.get("content") else f"{item['title']}에 대한 법률적 분석과 해결 사례입니다.",
                    "content": item.get("content", ""), # Return full content
                    "date": item.get("date") or item.get("timestamp", "")[:10] or "2025-01-01",
                    "tags": item.get("topic_tags", []),
                    "url": item.get("url"),
                    "cover_image": cover_image
                })
                
    # Sort by date desc initially to prioritize latest when deduplicating
    articles.sort(key=lambda x: x["date"] or "", reverse=True)
    
    # 2. Deduplicate by standardized title
    unique_articles = []
    seen_titles = set()
    
    import re
    def normalize_title(t):
        # Remove extensions, special chars, standardize
        t = re.sub(r'\.(pdf|docx|txt)$', '', t, flags=re.IGNORECASE)
        t = re.sub(r'[_\-]', ' ', t)
        return t.strip()

    # Deterministic helpers for enrichment (simulate "analysis")
    def get_mock_enrichment(output_id):
        # deterministically generate based on ID hash
        h = sum(ord(c) for c in output_id)
        
        durations = ["3개월", "6개월", "8개월", "1년", "1년 4개월", "2년"]
        results = [
            "승소 (전부 승소)", "일부 승소 (80% 인정)", "화해 권고 결정", 
            "조정 성립", "집행유예", "기소유예", "무죄 판결"
        ]
        issues_pool = [
            "증거 불충분 입증", "법리적 오해 주장", "절차적 위법성 강조", 
            "피해자 합의 유도", "양형 사유 적극 소명", "재산 형성 기여도 입증",
            "계약 해석의 다툼", "과실 비율 산정"
        ]
        
        return {
            "duration": durations[h % len(durations)],
            "result": results[(h + 1) % len(results)],
            "key_issues": [
                issues_pool[(h + 2) % len(issues_pool)],
                issues_pool[(h + 5) % len(issues_pool)]
            ]
        }

    for art in articles:
        norm_title = normalize_title(art["title"])
        
        # Humanize title for display
        art["display_title"] = norm_title
        
        if norm_title in seen_titles:
            continue
            
        seen_titles.add(norm_title)
        
        # Enrich if missing
        # Check if item has 'case_result' usually not in content_items of old mocks
        # So we use mock generator
        enrichment = get_mock_enrichment(art["id"])
        
        art["key_issues"] = art.get("key_issues") or enrichment["key_issues"]
        art["result_summary"] = art.get("result_summary") or enrichment["result"]
        art["duration"] = art.get("duration") or enrichment["duration"]
        
        # Simplify category mapping
        type_map = {"case": "승소사례", "column": "법률칼럼", "blog": "블로그"}
        art["category_label"] = type_map.get(art["type"], "기타")
        
        unique_articles.append(art)
        
    return unique_articles

@app.get("/api/magazine/{article_id}")
def get_magazine_article_detail(article_id: str):
    for lawyer in LAWYERS_DB:
        for item in lawyer.get("content_items", []):
            if item["id"] == article_id:
                # Found the item
                return {
                    "id": item["id"],
                    "lawyer_id": lawyer["id"],  # type: ignore
                    "lawyer_name": lawyer["name"],  # type: ignore
                    "lawyer_image": lawyer.get("cutoutImageUrl"),
                    "firm": lawyer.get("firm", "Lawnald Partner"),
                    "type": item["type"],
                    "title": item["title"],
                    "summary": item.get("summary") or (item.get("content", "")[:100] + "..." if item.get("content") else f"{item['title']}에 대한 요약입니다."),
                    "content": item.get("content") or f"{item['title']}에 대한 상세 내용입니다.\n\n(본문 내용이 없습니다.)",
                    "date": item["date"],
                    "tags": item.get("topic_tags", []),
                    "url": item.get("url")
                }
    
    raise HTTPException(status_code=404, detail="기사를 찾을 수 없습니다.")





# --- Content Submission ---

class ContentSubmission(BaseModel):
    type: str # column, youtube, book, lecture
    title: str
    content: Optional[str] = None # Text content or Description
    url: Optional[str] = None
    tags: List[str] = []

def generate_youtube_summary(url: str, title: str) -> str:
    # Deprecated: User requested Score-Only system.
    # No summary generation, just return empty or placeholder.
    return ""

@app.post("/api/lawyers/{lawyer_id}/content")
def submit_general_content(lawyer_id: str, submission: ContentSubmission):
    lawyer = next((l for l in LAWYERS_DB if l["id"] == lawyer_id), None)
    if not lawyer:
        raise HTTPException(status_code=404, detail="Lawyer not found")
    
    # Process YouTube
    summary = ""
    content_body = submission.content or ""
    
    if submission.type == "youtube":
        if not submission.url:
             raise HTTPException(status_code=400, detail="YouTube URL is required")
        # Auto-summarize
        summary = generate_youtube_summary(submission.url, submission.title)  # type: ignore
        # Append summary to content body if empty, or just use it
        if not content_body:
            content_body = summary
    else:
        # Default summary
        summary = content_body[:100] + "..." if content_body else ""  # type: ignore
        
    # (Prior logic for YouTube summary or default summary remains above)

        
    # --- Content Validation ---
    # 1. Length Check
    len_check = content_validator.validate_length(content_body, min_length=100) # relaxed for manual testing  # type: ignore
    if not len_check["valid"]:
        raise HTTPException(status_code=400, detail=len_check["message"])

    # 2. Keyword Density (Extract from title first)
    target_keywords = seo.seo_generator.extract_keywords(submission.title)
    kw_check = content_validator.check_keyword_density(content_body, target_keywords)  # type: ignore
    if not kw_check["valid"]:
        # Warning only, don't block
        print(f"Content Warning: {kw_check['warnings']}")

    # 3. Duplicate Check (using async wrapper needed? No, just call synchronous part if possible or await)
    # Since search_engine is synchronous mostly, let's just run it. 
    # But validator is async def... let's fix validator to be sync for simplicity in this prototype
    # or just await it if we are in async def. 
    # THIS FUNCTION IS 'def' not 'async def'. 
    # Let's assume validation is fast enough or use sync version.
    
    # --- PII Masking ---
    content_body = seo.pii_masker.mask(content_body)
    submission.title = seo.pii_masker.mask(submission.title)

    # --- SEO Generation ---
    slug = seo.seo_generator.generate_slug(submission.title)
    seo_title = seo.seo_generator.generate_seo_title(submission.title, lawyer["name"], submission.type)
    meta_desc = seo.seo_generator.generate_meta_description(content_body, summary)
    
    # Store SEO data
    seo_data = {
        "slug": slug,
        "seo_title": seo_title,
        "meta_description": meta_desc,
        "robots": "index, follow",
        "canonical": f"https://lawnald.com/magazine/{slug}",
        "faq": seo.seo_generator.generate_faq(content_body, submission.title),
        "schema_org": "{}" # Generated at runtime or stored here. Let's rely on runtime generation in frontend or generate now.
    }
        
    # --- Auto Image Generation ---
    image_url = None
    if submission.url and isinstance(submission.url, str) and submission.url.startswith("http"):  # type: ignore
        if "jpg" in submission.url or "png" in submission.url:  # type: ignore
            image_url = submission.url
            
    if not image_url:
        import urllib.parse
        import random
        # Use safe, English-only prompts with random variation to ensure stability
        safe_prompts = [
            "legal concept, cinematic lighting, professional, 4k",
            "modern law firm office, interior design, cinematic",
            "courtroom, gavel, justice, dramatic lighting",
            "law books, library, wisdom, professional",
            "scales of justice, golden hour, cinematic"
        ]
        chosen_prompt = random.choice(safe_prompts)
        encoded = urllib.parse.quote(chosen_prompt)
        image_url = f"https://image.pollinations.ai/prompt/{encoded}?width=800&height=600&nologo=true"

    import uuid
    new_submission = {
        "id": str(uuid.uuid4()),
        "lawyer_id": lawyer_id,
        "lawyer_name": lawyer["name"],
        "type": submission.type,
        "title": submission.title,
        "summary": summary,
        "content": content_body,
        "topic_tags": submission.tags,
        "status": "approved", # Auto-approve for demo convenience
        "date": datetime.now().strftime("%Y-%m-%d"),
        "url": submission.url,
        "image": image_url, # Save the generated image
        "seo": seo_data
    }
    
    # Direct add to lawyer items for demo speed
    lawyer["content_items"].insert(0, new_submission)
    save_db()
    
    return {"message": "콘텐츠가 등록되었습니다.", "item": new_submission}

@app.get("/api/lawyers/{lawyer_id}/cases")
def get_lawyer_cases(lawyer_id: str):
    lawyer = next((l for l in LAWYERS_DB if l["id"] == lawyer_id), None)
    if not lawyer:
        raise HTTPException(status_code=404, detail="Lawyer not found")
        
    # distinct from cases.py, this returns the 'content_items' of type 'case'
    cases = [item for item in lawyer.get("content_items", []) if item.get("type") == "case"]
    cases.sort(key=lambda x: x.get("date", ""), reverse=True)
    return cases

@app.delete("/api/lawyers/{lawyer_id}/content/{item_id}")
def delete_lawyer_content(lawyer_id: str, item_id: str):
    lawyer = next((l for l in LAWYERS_DB if l["id"] == lawyer_id), None)
    if not lawyer:
        raise HTTPException(status_code=404, detail="Lawyer not found")
    
    content_items = lawyer.get("content_items", [])
    initial_len = len(content_items)
    
    # Filter out the item to delete
    lawyer["content_items"] = [item for item in content_items if item.get("id") != item_id]
    
    if len(lawyer["content_items"]) == initial_len:
        raise HTTPException(status_code=404, detail="Content not found")
        
    save_lawyers_db(LAWYERS_DB)
    return {"message": "Content deleted successfully"}

@app.get("/api/admin/lawyers/pending", response_model=List[LawyerModel])
def get_pending_lawyers():
    # 실제 가입 변호사 중 미인증된 변호사만 반환 (가상 변호사 제외)
    return [l for l in LAWYERS_DB if l.get("verified") is False and not l.get("is_mock", False)]

@app.post("/api/admin/lawyers/{lawyer_id}/verify")
def verify_lawyer(lawyer_id: str):
    lawyer = next((l for l in LAWYERS_DB if l["id"] == lawyer_id), None)
    if not lawyer:
        raise HTTPException(status_code=404, detail="변호사를 찾을 수 없습니다.")
    
    lawyer["verified"] = True
    lawyer["location"] = lawyer["location"].replace(" (등록 대기)", "") # Remove pending tag if present
    lawyer["matchScore"] = 50 # Give a base score so they can appear in search
    lawyer["content_highlights"] = "신규 등록 변호사"
    
    save_lawyers_db(LAWYERS_DB)
    return {"message": "변호사가 성공적으로 인증되었습니다.", "lawyer": lawyer}

# --- Admin Lawyer Management (List & Edit) ---

class LawyerUpdateModel(BaseModel):
    name: Optional[str] = None
    firm: Optional[str] = None
    location: Optional[str] = None
    career: Optional[str] = None
    education: Optional[str] = None
    phone: Optional[str] = None
    homepage: Optional[str] = None
    kakao_id: Optional[str] = None
    expertise: Optional[List[str]] = None
    introduction_short: Optional[str] = None
    introduction_long: Optional[str] = None

@app.get("/api/admin/lawyers", response_model=List[LawyerModel])
def get_all_lawyers(q: Optional[str] = None, include_mock: bool = False):
    filtered = LAWYERS_DB if include_mock else [l for l in LAWYERS_DB if not l.get("is_mock", False)]
    if q:
        return [l for l in filtered if q.lower() in l["name"].lower() or q.lower() in l["id"].lower()]
    return filtered

@app.put("/api/admin/lawyers/{lawyer_id}")
def update_lawyer(lawyer_id: str, update_data: LawyerUpdateModel):
    lawyer = next((l for l in LAWYERS_DB if l["id"] == lawyer_id), None)
    if not lawyer:
        raise HTTPException(status_code=404, detail="변호사를 찾을 수 없습니다.")
    
    # Update fields if provided
    if update_data.name is not None: lawyer["name"] = update_data.name
    if update_data.firm is not None: lawyer["firm"] = update_data.firm
    if update_data.location is not None: lawyer["location"] = update_data.location
    if update_data.career is not None: lawyer["career"] = update_data.career
    if update_data.education is not None: lawyer["education"] = update_data.education
    if update_data.phone is not None: lawyer["phone"] = update_data.phone
    if update_data.homepage is not None: lawyer["homepage"] = update_data.homepage
    if update_data.kakao_id is not None: lawyer["kakao_id"] = update_data.kakao_id
    if update_data.expertise is not None: lawyer["expertise"] = update_data.expertise
    if update_data.introduction_short is not None: lawyer["introduction_short"] = update_data.introduction_short
    if update_data.introduction_long is not None: lawyer["introduction_long"] = update_data.introduction_long
    
    print(f"Updated lawyer {lawyer_id}: {update_data}")
    save_lawyers_db(LAWYERS_DB)
    return {"message": "변호사 정보가 업데이트되었습니다.", "lawyer": lawyer}



# --- Real-time Chat System ---


@app.get("/api/lawyers/{lawyer_id}/chats")
def get_lawyer_chats(lawyer_id: str):
    return chat_manager.get_lawyer_chats(lawyer_id)

@app.get("/api/chats/{lawyer_id}/{client_id}/messages")
def get_chat_history(lawyer_id: str, client_id: str):
    return chat_manager.get_history(lawyer_id, client_id)

# --- Analytics API ---

class BlogMetrics(BaseModel):
    views: int = 0
    dwell_time_avg: float = 0.0 # seconds
    clicks: int = 0 # CTA clicks
    conversions: int = 0 # Chat/Call checks

# In-memory metrics storage (lawyer_id -> {slug -> BlogMetrics})
# For prototype, we store in a simple dict.
BLOG_METRICS_DB: Dict[str, Dict[str, BlogMetrics]] = {}

@app.post("/api/analytics/track")
def track_analytics(
    lawyer_id: str = Body(...),
    slug: str = Body(...),
    event_type: str = Body(..., regex="^(view|click|conversion|dwell)$"),
    value: float = Body(0.0)
):
    if lawyer_id not in BLOG_METRICS_DB:
        BLOG_METRICS_DB[lawyer_id] = {}
    
    if slug not in BLOG_METRICS_DB[lawyer_id]:
        BLOG_METRICS_DB[lawyer_id][slug] = BlogMetrics()
        
    metrics = BLOG_METRICS_DB[lawyer_id][slug]
    
    if event_type == "view":
        metrics.views += 1
    elif event_type == "click":
        metrics.clicks += 1
    elif event_type == "conversion":
        metrics.conversions += 1
    elif event_type == "dwell":
        # simple moving average for prototype
        current_total = metrics.dwell_time_avg * metrics.views # approx
        metrics.dwell_time_avg = (current_total + value) / max(1, metrics.views)
        
    return {"status": "ok"}

@app.get("/api/lawyers/{lawyer_id}/analytics")
def get_lawyer_analytics(lawyer_id: str):
    if lawyer_id not in BLOG_METRICS_DB:
        return {"total_views": 0, "top_posts": []}
    
    data = BLOG_METRICS_DB[lawyer_id]
    total_views = sum(m.views for m in data.values())
    total_conversions = sum(m.conversions for m in data.values())
    
    top_posts = []
    for slug, metrics in data.items():
        top_posts.append({
            "slug": slug,
            "views": metrics.views,
            "clicks": metrics.clicks,
            "dwell_time": round(metrics.dwell_time_avg, 1)  # type: ignore
        })
    
    top_posts.sort(key=lambda x: x["views"], reverse=True)
    
    return {
        "total_views": total_views,
        "total_conversions": total_conversions,
        "avg_dwell_time": sum(m.dwell_time_avg for m in data.values()) / max(1, len(data)) if data else 0,
        "top_posts": top_posts[:5]  # type: ignore
    }


# --- Case Upload & Parsing ---
try:
    from case_parser_v2 import case_parser  # type: ignore
    print("DEBUG: Successfully imported case_parser from case_parser_v2")
except ImportError as e:
    print(f"DEBUG: Failed to import case_parser_v2: {e}")
    try:
        from case_parser_v2 import case_parser  # type: ignore
        print("DEBUG: Successfully imported case_parser from case_parser_v2")
    except ImportError as e2:  # type: ignore
        print(f"DEBUG: Failed to import case_parser_v2: {e2}")
        # Re-raise to see the error in logs if both fail
        raise e2


try:
    from seo import seo_generator  # type: ignore
except ImportError:
    from seo import seo_generator  # type: ignore

class CasePublishRequest(BaseModel):
    case_number: str
    court: str
    title: str
    story: str # The 1000-char narrative
    full_text: str
    lawyer_id: str
    file_hash: str
    ai_tags: str = ""
    summary: str = "" # Short summary/excerpt
    facts: str = "" # Added to match endpoint usage
    emotional_title: Optional[str] = None # New field
    emotional_summary: Optional[str] = None # New field
    key_takeaways: Optional[List[str]] = [] # New field for checklists




@app.post("/api/cases/upload")
async def upload_case_pdf(file: UploadFile = File(...)):
    # 1. Validate file type
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed.")
    
    # 2. Save temporarily
    temp_dir = "temp_uploads"
    os.makedirs(temp_dir, exist_ok=True)
    temp_path = os.path.join(temp_dir, f"{uuid4()}_{file.filename}")
    
    try:
        with open(temp_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)
        
        abs_temp_path = os.path.abspath(temp_path)
        print(f"DEBUG: Endpoint uploaded file to: {abs_temp_path}")

        # 3. Extract Text
        raw_text = case_parser.extract_text_from_pdf(temp_path)
        text_len = len(raw_text.strip()) if raw_text else 0
        print(f"DEBUG: Extracted text length: {text_len}")
        
        # Calculate File Hash for Deduplication
        with open(temp_path, "rb") as f:
            file_bytes = f.read()
            file_hash = hashlib.sha256(file_bytes).hexdigest()

        # Deduplication Check: Look across all lawyers
        for lawyer in LAWYERS_DB:
            for item in lawyer.get("content_items", []):
                if item.get("file_hash") == file_hash:
                    case_parser.log_debug(f"DEBUG: Duplicate PDF detected (Hash: {file_hash[:10]}...)")  # type: ignore
                    raise HTTPException(status_code=409, detail="이미 등록된 판결문입니다. 중복 업로드는 허용되지 않습니다.")

        # Check if text is sufficient. If not, try Vision fallback
        if not raw_text or text_len < 100:
             print("DEBUG: Text extraction insufficient (<100 chars). Attempting Vision Parsing (OCR Fallback)...")
             structured_data = case_parser.parse_from_images(temp_path)
        else:
             structured_data = case_parser.parse_structure(raw_text)
        
        # 5. Anonymize (First pass)
        structured_data["full_text"] = case_parser.anonymize_additional(structured_data["full_text"])
        
        structured_data["file_hash"] = file_hash
        
        case_parser.log_debug(f"DEBUG: upload_case_pdf returning narrative. Story len: {len(structured_data.get('client_story', ''))}")
        return structured_data

    except Exception as e:
        import traceback
        print(f"CRITICAL ERROR in upload_case_pdf: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        # Cleanup
        if os.path.exists(temp_path):
            os.remove(temp_path)

@app.post("/api/cases/publish")
async def publish_case(data: CasePublishRequest):
    """
    Submit a winning case for admin approval.
    """
    lawyer = next((l for l in LAWYERS_DB if l["id"] == data.lawyer_id), None)
    if not lawyer:
        raise HTTPException(status_code=404, detail="Lawyer not found.")

    # Deduplication Check (Final)
    for existing_item in lawyer.get("content_items", []):
        if existing_item.get("file_hash") == data.file_hash:
            raise HTTPException(status_code=409, detail="이미 등록된 판결문입니다.")

    # 1. Create Pending Item
    case_id = str(uuid4())
    print(f"DEBUG: Generated case_id={case_id}")

    slug = seo_generator.generate_slug(data.title)
    
    pending_item = {
        "id": case_id,
        "type": "case",
        "title": data.title,
        "summary": data.summary or data.story[:100] + "...",  # type: ignore
        "content": data.story, # The full narrative
        "full_text": data.full_text, # Original text (anonymized)
        "case_number": data.case_number,
        "court": data.court,
        "topic_tags": [t.strip() for t in data.ai_tags.split(",") if t.strip()],
        "file_hash": data.file_hash,
        "status": "pending", # Awaiting admin approval
        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "date": datetime.now().strftime("%Y-%m-%d"), # Required for magazine feed
        "slug": slug,
        "lawyer_id": data.lawyer_id,
        "lawyer_name": lawyer["name"],
        "key_takeaways": data.key_takeaways or [] # Persist key takeaways
    }
    
    if "content_items" not in lawyer:
        lawyer["content_items"] = []
    
    lawyer["content_items"].insert(0, pending_item)
    save_lawyers_db(LAWYERS_DB)
    
    # RAG: 임베딩 저장
    try:
        from case_embeddings import store_case_embedding  # type: ignore
        store_case_embedding(
            case_id=case_id,
            lawyer_id=data.lawyer_id,
            lawyer_name=lawyer["name"],
            title=data.title,
            content=data.story,
            case_number=data.case_number,
            court=data.court,
            ai_tags=data.ai_tags,
            file_hash=data.file_hash
        )
    except Exception as e:
        print(f"⚠️ RAG 임베딩 저장 실패 (무시): {e}")
    
    return {"message": "승소사례가 성공적으로 접수되었습니다. 관리자 승인 후 게시됩니다.", "case_id": case_id}


# --- Bulk Upload / Publish ---

@app.post("/api/cases/bulk-upload")
async def bulk_upload_pdfs(files: List[UploadFile] = File(...)):
    """
    최대 20개 판결문 PDF를 일괄 업로드하고 AI 분석.
    각 파일을 순차 처리하여 결과를 반환합니다.
    """
    if len(files) > 20:
        raise HTTPException(status_code=400, detail="최대 20개 파일까지 업로드 가능합니다.")
    
    if len(files) == 0:
        raise HTTPException(status_code=400, detail="파일을 선택해주세요.")
    
    results = []
    temp_dir = "temp_uploads"
    os.makedirs(temp_dir, exist_ok=True)
    
    for idx, file in enumerate(files):
        result = {
            "index": idx,
            "filename": file.filename,
            "status": "pending",
            "error": None,
            "data": None
        }
        
        if not file.filename.lower().endswith('.pdf'):
            result["status"] = "error"
            result["error"] = f"PDF 파일만 업로드 가능합니다: {file.filename}"
            results.append(result)
            continue
        
        temp_path = os.path.join(temp_dir, f"{uuid4()}_{file.filename}")
        
        try:
            # Save temp file
            with open(temp_path, "wb") as buffer:
                content = await file.read()
                buffer.write(content)
            
            # Extract text
            raw_text = case_parser.extract_text_from_pdf(temp_path)
            text_len = len(raw_text.strip()) if raw_text else 0
            
            # File hash for dedup
            with open(temp_path, "rb") as f:
                file_bytes = f.read()
                file_hash = hashlib.sha256(file_bytes).hexdigest()
            
            # Dedup check
            is_duplicate = False
            for lawyer in LAWYERS_DB:
                for item in lawyer.get("content_items", []):
                    if item.get("file_hash") == file_hash:
                        is_duplicate = True
                        break
                if is_duplicate:
                    break
            
            if is_duplicate:
                result["status"] = "duplicate"
                result["error"] = "이미 등록된 판결문입니다."
                results.append(result)
                continue
            
            # Parse with AI
            if not raw_text or text_len < 100:
                structured_data = case_parser.parse_from_images(temp_path)
            else:
                structured_data = case_parser.parse_structure(raw_text)
            
            # Anonymize full text
            structured_data["full_text"] = case_parser.anonymize_additional(structured_data["full_text"])
            structured_data["file_hash"] = file_hash
            
            result["status"] = "success"
            result["data"] = structured_data
            
        except Exception as e:
            result["status"] = "error"
            result["error"] = str(e)
        finally:
            if os.path.exists(temp_path):
                os.remove(temp_path)
        
        results.append(result)
    
    success_count = sum(1 for r in results if r["status"] == "success")
    error_count = sum(1 for r in results if r["status"] == "error")
    duplicate_count = sum(1 for r in results if r["status"] == "duplicate")
    warning_count = sum(1 for r in results if r["status"] == "success" and r["data"] and r["data"].get("has_name_warning"))
    
    return {
        "total": len(files),
        "success": success_count,
        "errors": error_count,
        "duplicates": duplicate_count,
        "name_warnings": warning_count,
        "results": results
    }


class BulkPublishItem(BaseModel):
    case_number: str = ""
    court: str = ""
    title: str
    story: str  # client_story
    full_text: str = ""
    file_hash: str
    ai_tags: str = ""
    summary: str = ""
    key_takeaways: Optional[List[str]] = []

class BulkPublishRequest(BaseModel):
    lawyer_id: str
    cases: List[BulkPublishItem]

@app.post("/api/cases/bulk-publish")
async def bulk_publish_cases(data: BulkPublishRequest):
    """
    여러 건의 승소사례를 일괄 게시 요청.
    """
    lawyer = next((l for l in LAWYERS_DB if l["id"] == data.lawyer_id), None)
    if not lawyer:
        raise HTTPException(status_code=404, detail="Lawyer not found.")
    
    if "content_items" not in lawyer:
        lawyer["content_items"] = []
    
    published = []
    skipped = []
    
    for case_item in data.cases:
        # Dedup check
        is_dup = any(
            item.get("file_hash") == case_item.file_hash
            for item in lawyer.get("content_items", [])
        )
        if is_dup:
            skipped.append({"title": case_item.title, "reason": "중복"})
            continue
        
        case_id = str(uuid4())
        slug = seo_generator.generate_slug(case_item.title)
        
        pending_item = {
            "id": case_id,
            "type": "case",
            "title": case_item.title,
            "summary": case_item.summary or case_item.story[:100] + "...",
            "content": case_item.story,
            "full_text": case_item.full_text,
            "case_number": case_item.case_number,
            "court": case_item.court,
            "topic_tags": [t.strip() for t in case_item.ai_tags.split(",") if t.strip()],
            "file_hash": case_item.file_hash,
            "status": "pending",
            "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "date": datetime.now().strftime("%Y-%m-%d"),
            "slug": slug,
            "lawyer_id": data.lawyer_id,
            "lawyer_name": lawyer["name"],
            "key_takeaways": case_item.key_takeaways or []
        }
        
        lawyer["content_items"].insert(0, pending_item)
        published.append({"title": case_item.title, "case_id": case_id})
        
        # RAG: 임베딩 저장
        try:
            from case_embeddings import store_case_embedding  # type: ignore
            store_case_embedding(
                case_id=case_id,
                lawyer_id=data.lawyer_id,
                lawyer_name=lawyer["name"],
                title=case_item.title,
                content=case_item.story,
                case_number=case_item.case_number,
                court=case_item.court,
                ai_tags=case_item.ai_tags,
                file_hash=case_item.file_hash
            )
        except Exception as e:
            print(f"⚠️ RAG 임베딩 저장 실패 (무시): {e}")
    
    save_lawyers_db(LAWYERS_DB)
    
    return {
        "message": f"{len(published)}건의 승소사례가 접수되었습니다.",
        "published": len(published),
        "skipped": len(skipped),
        "details": published,
        "skipped_details": skipped
    }


# --- RAG: 유사 판례 검색 ---

class SimilarCaseQuery(BaseModel):
    query: str
    top_k: int = 5
    threshold: float = 0.5

@app.post("/api/cases/search-similar")
async def search_similar_cases_api(data: SimilarCaseQuery):
    """
    사건개요를 입력하면 유사 판례를 검색합니다.
    벡터 유사도(코사인) 기반 검색.
    """
    if not data.query.strip():
        raise HTTPException(status_code=400, detail="검색어를 입력해주세요.")
    
    try:
        from case_embeddings import search_similar_cases  # type: ignore
        results = search_similar_cases(
            query=data.query,
            top_k=data.top_k,
            threshold=data.threshold
        )
        return {
            "query": data.query,
            "count": len(results),
            "results": results
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"검색 실패: {str(e)}")


@app.get("/api/cases/rag-setup")
async def get_rag_setup_sql():
    """RAG 테이블 설정 SQL을 반환합니다."""
    try:
        from case_embeddings import SETUP_SQL  # type: ignore
        return {"sql": SETUP_SQL}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/admin/drafts")
async def get_admin_drafts():
    """
    Get all pending winning cases for admin approval.
    """
    pending_items = []
    # print("DEBUG: fetching admin drafts...")
    for lawyer in LAWYERS_DB:
        # print(f"DEBUG: Checking lawyer {lawyer['id']}, items: {len(lawyer.get('content_items', []))}")
        for item in lawyer.get("content_items", []):
            if item.get("status") == "pending":
                # print(f"DEBUG: Found pending item: {item.get('title')}")
                pending_items.append(item)
    
    # print(f"DEBUG: Total pending items found: {len(pending_items)}")
    return sorted(pending_items, key=lambda x: x.get("timestamp", ""), reverse=True)



@app.get("/api/admin/submissions")
async def get_admin_submissions(status: str = "pending"):
    """
    Get all submissions for admin approval.
    """
    pending_items = []
    for lawyer in LAWYERS_DB:
        for item in lawyer.get("content_items", []):
            if item.get("status") == status:
                # Add lawyer info to item for admin view if not present
                if "lawyer_name" not in item:
                    item["lawyer_name"] = lawyer["name"]  # type: ignore
                if "lawyer_id" not in item:
                    item["lawyer_id"] = lawyer["id"]  # type: ignore
                
                # Ensure topic_tags exists if tags exists
                if "topic_tags" not in item and "tags" in item:
                    item["topic_tags"] = item["tags"]
                    
                pending_items.append(item)
    
    return sorted(pending_items, key=lambda x: x.get("timestamp", ""), reverse=True)


@app.post("/api/admin/submissions/{item_id}/approve")
async def approve_submission(item_id: str):
    """
    Approve a submission by ID. Finds the lawyer and updates status.
    """
    for lawyer in LAWYERS_DB:
        for item in lawyer.get("content_items", []):
            if item.get("id") == item_id:
                if item.get("status") == "published":
                    return {"message": "Already approved"}
                
                item["status"] = "published"
                item["verified"] = True
                
                # Boost score
                if "suitability_score" not in lawyer:
                    lawyer["suitability_score"] = 0
                lawyer["suitability_score"] += 10  # type: ignore
                
                save_lawyers_db(LAWYERS_DB)
                return {"message": "Approved successfully"}
                
    raise HTTPException(status_code=404, detail="Submission not found")


@app.post("/api/admin/submissions/{item_id}/reject")
async def reject_submission(item_id: str):
    """
    Reject a submission by ID.
    """
    for lawyer in LAWYERS_DB:
        for item in lawyer.get("content_items", []):
            if item.get("id") == item_id:
                item["status"] = "rejected"
                save_lawyers_db(LAWYERS_DB)
                return {"message": "Rejected successfully"}
                
    raise HTTPException(status_code=404, detail="Submission not found")


@app.post("/api/admin/cases/approve")
async def approve_case(case_id: str = Body(...), lawyer_id: str = Body(...)):
    """
    Legacy Admin approval endpoint: publishes the case and boosts lawyer score.
    """
    lawyer = next((l for l in LAWYERS_DB if l["id"] == lawyer_id), None)
    if not lawyer:
        raise HTTPException(status_code=404, detail="Lawyer not found.")
        
    case_item = next((item for item in lawyer.get("content_items", []) if item.get("id") == case_id), None)
    if not case_item:
        raise HTTPException(status_code=404, detail="Case not found.")
        
    if case_item.get("status") == "published":
        return {"message": "이미 승인된 사례입니다."}
        
    # 1. Update Status
    case_item["status"] = "published"
    case_item["verified"] = True # Critical for magazine visibility
    
    # 2. Boost Lawyer Suitability Score
    if "suitability_score" not in lawyer:
        lawyer["suitability_score"] = 0
    
    lawyer["suitability_score"] += 10 # Boost by 10 per approved case
    
    save_lawyers_db(LAWYERS_DB)
    
    return {
        "message": f"'{case_item['title']}' 사례가 승인되었습니다.",
        "new_score": lawyer["suitability_score"]
    }


# --- Consultation API ---
@app.post("/api/consultations")
async def create_consultation(request: ConsultationCreateRequest):
    """
    Creates a new consultation request and analyzes it with AI.
    """
    lawyer = next((l for l in LAWYERS_DB if l["id"] == request.lawyer_id), None)
    if not lawyer:
        raise HTTPException(status_code=404, detail="Lawyer not found")

    # Analyze with AI
    analysis = consultation.analyze_consultation_text(request.text)
    
    # Create Consultation Object
    new_consultation = {
        "id": str(uuid4()),
        "created_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "status": "new",
        "client_name": request.client_name or "익명",
        "client_phone": request.client_phone or "",
        "original_text": request.text,
        # AI Analysis Results
        "case_title": analysis.get("case_title", "제목 없음"),
        "primary_area": analysis.get("primary_area", "기타"),
        "summary": analysis.get("summary", ""),
        "confidence": analysis.get("confidence", 0.0),
        "key_facts": analysis.get("key_facts", []),
        "key_issues": analysis.get("key_issues", []),
        "checklist": analysis.get("checklist", []),
        "next_steps": analysis.get("next_steps", []),
        "risk_notes": analysis.get("risk_notes", []),
        "missing_questions": analysis.get("missing_questions", []),
        "tags": [analysis.get("primary_area", "기타")]
    }
    
    if "consultations" not in lawyer:
        lawyer["consultations"] = []
        
    lawyer["consultations"].insert(0, new_consultation)
    save_lawyers_db(LAWYERS_DB)
    
    return {"message": "Consultation created", "id": new_consultation["id"]}

@app.get("/api/consultations")
async def get_consultations(lawyer_id: str, status: Optional[str] = None, search: Optional[str] = None):
    """
    Get consultations for a specific lawyer, optionally filtered by status or search text.
    """
    lawyer = next((l for l in LAWYERS_DB if l["id"] == lawyer_id), None)
    if not lawyer:
        raise HTTPException(status_code=404, detail="Lawyer not found")
        
    consultations = lawyer.get("consultations", [])
    
    # Filter by status
    if status and status != "":
        consultations = [c for c in consultations if c.get("status") == status]
        
    # Filter by search query
    if search and search != "":
        search_lower = search.lower()
        consultations = [c for c in consultations if 
                         search_lower in c.get("case_title", "").lower() or 
                         search_lower in c.get("summary", "").lower() or
                         search_lower in c.get("client_name", "").lower()]
                         
    return consultations

# --- Case Archive API ---
try:
    from cases import case_manager  # type: ignore
except ImportError:
    from cases import case_manager  # type: ignore

@app.get("/api/cases/admin")
def get_admin_cases():
    return case_manager.get_all_cases_admin()

@app.get("/api/cases/my")
def get_my_cases(lawyer_id: str = "lawyer1@example.com"): # Hardcoded for now
    return case_manager.get_my_cases(lawyer_id)

@app.get("/api/cases/archive")
def get_archive_cases(query: Optional[str] = None, field: Optional[str] = None):
    return case_manager.get_archive_cases(query, field)

class CaseSubmission(BaseModel):
    title: str
    summary: str
    tags: List[str]
    case_type: str
    field: str
    result: str
    stage: str
    
    # Original Data
    client_name: str
    client_phone: str
    case_number: str
    judge_name: str
    full_text: str
    internal_notes: str

@app.post("/api/cases")
def submit_case(submission: CaseSubmission):
    lawyer_id = "lawyer1@example.com" # Mock auth
    return case_manager.submit_case(lawyer_id, submission.dict())

class StatusUpdate(BaseModel):
    status: str
    feedback: Optional[str] = None

@app.put("/api/cases/{case_id}/status")
def update_case_status(case_id: str, update: StatusUpdate):
    success = case_manager.update_status(case_id, update.status, update.feedback)
    if not success:
        raise HTTPException(status_code=404, detail="Case not found")
    return {"status": "success"}

# --- Magazine Management (Admin) ---

@app.post("/api/admin/content/{content_id}/toggle-visibility")
def toggle_content_visibility(content_id: str):
    """Toggle the 'verified' status of a content item."""
    for lawyer in LAWYERS_DB:
        for item in lawyer.get("content_items", []):
            if item["id"] == content_id:
                item["verified"] = not item.get("verified", False)
                save_db()
                return {"message": "Visibility toggled", "verified": item["verified"]}
    raise HTTPException(status_code=404, detail="Content not found")

@app.delete("/api/admin/content/{content_id}")
def delete_content(content_id: str):
    """Permanently delete a content item."""
    for lawyer in LAWYERS_DB:
        content_items = lawyer.get("content_items", [])
        for i, item in enumerate(content_items):
            if item["id"] == content_id:
                del content_items[i]
                save_db()
                return {"message": "Content deleted"}
    raise HTTPException(status_code=404, detail="Content not found")

# --- Admin Lawyer Management ---

class BatchLawyerIds(BaseModel):
    lawyer_ids: List[str]

class LawyerUpdateModel(BaseModel):
    name: Optional[str] = None
    firm: Optional[str] = None
    location: Optional[str] = None
    career: Optional[str] = None
    education: Optional[str] = None
    phone: Optional[str] = None
    homepage: Optional[str] = None
    kakao_id: Optional[str] = None
    expertise: Optional[List[str]] = None
    introduction_short: Optional[str] = None
    introduction_long: Optional[str] = None

@app.get("/api/admin/lawyers/pending")
def get_pending_lawyers():
    # 실제 가입 변호사 중 미인증된 변호사만 반환 (가상 변호사 제외)
    return [l for l in LAWYERS_DB if l.get("verified") is False and not l.get("is_mock", False)]

@app.post("/api/admin/lawyers/{lawyer_id}/verify")
def verify_lawyer(lawyer_id: str):
    lawyer = next((l for l in LAWYERS_DB if l["id"] == lawyer_id), None)
    if not lawyer:
        raise HTTPException(status_code=404, detail="변호사를 찾을 수 없습니다.")
    
    lawyer["verified"] = True
    lawyer["location"] = lawyer["location"].replace(" (등록 대기)", "")
    lawyer["matchScore"] = 50
    lawyer["content_highlights"] = "신규 등록 변호사"
    
    save_lawyers_db(LAWYERS_DB)
    return {"message": "변호사가 성공적으로 인증되었습니다.", "lawyer": lawyer}

@app.post("/api/admin/lawyers/{lawyer_id}/reject")
def reject_lawyer(lawyer_id: str):
    lawyer = next((l for l in LAWYERS_DB if l["id"] == lawyer_id), None)
    if not lawyer:
        raise HTTPException(status_code=404, detail="변호사를 찾을 수 없습니다.")
    
    LAWYERS_DB.remove(lawyer)
    save_lawyers_db(LAWYERS_DB)
    return {"message": "변호사 가입이 반려되었습니다."}

@app.post("/api/admin/lawyers/batch-verify")
def batch_verify_lawyers(data: BatchLawyerIds):
    verified_count = 0
    for lawyer_id in data.lawyer_ids:
        lawyer = next((l for l in LAWYERS_DB if l["id"] == lawyer_id), None)
        if lawyer and lawyer.get("verified") is False:
            lawyer["verified"] = True
            lawyer["location"] = lawyer.get("location", "").replace(" (등록 대기)", "")
            lawyer["matchScore"] = 50
            lawyer["content_highlights"] = "신규 등록 변호사"
            verified_count += 1
    
    save_lawyers_db(LAWYERS_DB)
    return {"message": f"{verified_count}명의 변호사가 승인되었습니다.", "count": verified_count}

@app.post("/api/admin/lawyers/batch-reject")
def batch_reject_lawyers(data: BatchLawyerIds):
    rejected_count = 0
    to_remove = []
    for lawyer_id in data.lawyer_ids:
        lawyer = next((l for l in LAWYERS_DB if l["id"] == lawyer_id), None)
        if lawyer and lawyer.get("verified") is False:
            to_remove.append(lawyer)
            rejected_count += 1
    
    for lawyer in to_remove:
        LAWYERS_DB.remove(lawyer)
    
    save_lawyers_db(LAWYERS_DB)
    return {"message": f"{rejected_count}명의 변호사 가입이 반려되었습니다.", "count": rejected_count}

@app.get("/api/admin/lawyers")
def get_all_lawyers(q: Optional[str] = None, include_mock: bool = False):
    filtered = LAWYERS_DB if include_mock else [l for l in LAWYERS_DB if not l.get("is_mock", False)]
    if q:
        return [l for l in filtered if q.lower() in l["name"].lower() or q.lower() in l["id"].lower()]
    return filtered

@app.put("/api/admin/lawyers/{lawyer_id}")
def update_lawyer(lawyer_id: str, update_data: LawyerUpdateModel):
    lawyer = next((l for l in LAWYERS_DB if l["id"] == lawyer_id), None)
    if not lawyer:
        raise HTTPException(status_code=404, detail="Lawyer not found")
    
    update_dict = update_data.dict(exclude_unset=True)
    for key, value in update_dict.items():
        if value is not None:
            lawyer[key] = value
    
    save_lawyers_db(LAWYERS_DB)
    return {"message": "Updated", "lawyer": lawyer}

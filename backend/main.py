from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, Query, UploadFile, File, HTTPException, Form, Body
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from search import search_engine
from data import LAWYERS_DB, save_lawyers_db
import image_utils
import os
import json
import seo 
try:
    from backend import seo_helper
except ImportError:
    import seo_helper 
try:
    from backend.compliance import compliance_engine
except ImportError:
    from compliance import compliance_engine
try:
    from backend import consultation
except ImportError:
    import consultation
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

# --- WebSocket Setup (Declared early) ---
try:
    from backend.chat import chat_manager
except ImportError:
    from chat import chat_manager
from fastapi import WebSocket, WebSocketDisconnect

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

from routers import crawler
app.include_router(crawler.router)

try:
    from backend.billing import router as billing_router
except ImportError:
    from billing import router as billing_router
app.include_router(billing_router)

try:
    from backend.admin_blog import router as admin_blog_router
except ImportError:
    from admin_blog import router as admin_blog_router
app.include_router(admin_blog_router)

try:
    from backend.push_notifications import router as push_router
except ImportError:
    from push_notifications import router as push_router
app.include_router(push_router)

print("\n" + "="*50)
print("STARTUP: Main.py loaded successfully")
print("="*50 + "\n")






# Ensure directories exist (Workaround for uvicorn CWD issues)
# Ensure directories exist (Workaround for uvicorn CWD issues)
try:
    import sys
    import backend.case_parser_v2 as case_parser_module
    with open("backend/debug_env.txt", "w", encoding="utf-8") as f:
        f.write(f"sys.executable: {sys.executable}\n")
        f.write(f"sys.path: {sys.path}\n")
        f.write(f"case_parser file: {case_parser_module.__file__}\n")
    os.makedirs("backend/uploads", exist_ok=True)

    os.makedirs("backend/temp_uploads", exist_ok=True)
    os.makedirs("backend/uploads/licenses", exist_ok=True)
    print(f"Verified directories: CWD={os.getcwd()}")
except Exception as e:
    print(f"Directory creation warning: {e}")

# --- Auto-start Chat Server ---
import subprocess
import socket
import sys

def is_port_in_use(port: int) -> bool:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        return s.connect_ex(('127.0.0.1', port)) == 0

@app.on_event("startup")
async def startup_event():
    chat_port = 8003
    if not is_port_in_use(chat_port):
        print(f"Chat server not running on port {chat_port}. Starting it automatically...")
        try:
            # Launch chat_server.py as a separate process
            # We use distinct Popen to let it run independent of this process loop
            subprocess.Popen([sys.executable, "backend/chat_server.py"])
            print("Chat server started successfully. (Reload Triggered)")
        except Exception as e:
            print(f"Failed to start chat server: {e}")
    else:
        print(f"Chat server already running on port {chat_port}.")

# --- Auth System ---

class LoginRequest(BaseModel):
    email: str
    password: str

# Mock Clients DB
CLIENTS_DB = [
    {"id": "client1", "email": "client@example.com", "password": "password", "name": "김철수"}
]

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
    # 1. Check for Admin Login (Hardcoded)
    if request.email == "macdee" and request.password == "02208888md!":
        return {
            "message": "Admin login successful", 
            "token": "admin_secret_token_123",
            "user": {"name": "관리자", "role": "admin", "email": "macdee"},
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
    return {"message": "Registration successful", "user": new_user}

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

LEADS_DB = []

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
        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    }
    
    LEADS_DB.append(lead)
    # Ideally persist leads to disk here
    
    print(f"변호사 {lawyer_id}에 대한 리드 생성: {request.contact_type}")
    return {"message": "리드가 성공적으로 접수되었습니다.", "lead_id": lead["id"]}

@app.get("/api/lawyers/{lawyer_id}/leads", response_model=List[LeadModel])
def get_lawyer_leads(lawyer_id: str):
    # Retrieve leads for this lawyer, sorted by latest first
    leads = [l for l in LEADS_DB if l["lawyer_id"] == lawyer_id]
    leads.sort(key=lambda x: x["timestamp"], reverse=True)
    return leads

# --- SEO Analysis Endpoints ---
from seo_helper import seo_helper

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
                    "lawyer_id": lawyer["id"],
                    "lawyer_name": lawyer["name"],
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

@app.post("/api/admin/magazine")
def create_magazine_post(request: MagazineCreateRequest):
    # Default to main lawyer for demo
    target_lawyer_id = "welder49264@naver.com" 
    lawyer = next((l for l in LAWYERS_DB if l["id"] == target_lawyer_id), None)
    
    if not lawyer:
        lawyer = LAWYERS_DB[0] # Fallback
        
    new_item = {
        "id": str(uuid4()),
        "type": "column", # Default to column
        "title": request.title,
        "content": request.content, # For simple display if needed logic differs
        "content_markdown": request.content, # Store as markdown
        "tags": [request.keyword],
        "category": request.category,
        "purpose": request.purpose,
        "date": datetime.now().strftime("%Y-%m-%d"),
        "view_count": 0,
        "cover_image": request.cover_image or "/images/pattern_1.jpg", 
        "summary": request.content[:200] + "...",
        "slug": request.title.replace(" ", "-"), # Simple slug
        "verified": True, # Auto-publish for admin
        # SEO Fields
        "seo": {
            "target_keyword": request.keyword,
            "purpose": request.purpose,
            "schema": seo_helper.generate_schema({
                "title": request.title, 
                "date": datetime.now().strftime("%Y-%m-%d"),
                "lawyer_name": lawyer["name"]
            })
        }
    }
    
    if "content_items" not in lawyer:
        lawyer["content_items"] = []
        
    lawyer["content_items"].insert(0, new_item)
    save_lawyers_db(LAWYERS_DB)
    
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
    top_case_categories = sorted(case_stats.items(), key=lambda x: x[1], reverse=True)[:5]
    
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
        
    top_consult_categories = sorted(consult_stats.items(), key=lambda x: x[1], reverse=True)[:5]

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
            "ratio": round(ratio, 2),
            "growth": round(growth, 1)
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
        "demand": demand_stats[:10] # Top 10
    }

from pdf_utils import extract_text_from_pdf
from pii_utils import mask_pii
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
    upload_dir = f"backend/uploads/cases/{lawyer_id}"
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
    from consultation import analyze_judgment
    
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
        "summary": request.overview[:100] + "...",
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
from consultation import analyze_consultation_text

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

CONSULTATIONS_DB = []

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

    # --- Send Notification to Dashboard via Chat Server (IPC) ---
    try:
        import websockets
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
    if lawyer.get("content_items"):
        # Check if any item is type 'case'
        # Simple check: just check if they have ANY case for now to stop the annoyance
        has_recent_case = any(item.get("type") == "case" for item in lawyer["content_items"])
        
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

    return suggestions[:3] # Return top 3

# Configure CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Mount static files
# Mount static files
app.mount("/static", StaticFiles(directory="static"), name="static")
app.mount("/uploads", StaticFiles(directory="backend/uploads"), name="uploads")

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

    # 3. Save original
    filename = f"{lawyer_id}_{file.filename}"
    original_path = await image_utils.save_upload_file(file, filename)
    
    # Update DB status - SKIP Background Removal as per user request
    # Just use the original image for both fields
    full_url = f"http://localhost:8000/static/images/original/{filename}"
    
    lawyer["imageUrl"] = full_url
    lawyer["cutoutImageUrl"] = full_url # Use original as cutout
    lawyer["bgRemoveStatus"] = "skipped"
    
    save_db()
    
    return {
        "message": "Photo uploaded successfully (Background removal skipped)", 
        "cutoutImageUrl": full_url,
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

SUBMISSIONS_DB = []

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
            
            # Save file
            import shutil
            file_path = f"static/documents/{filename}"
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
            
            file_url = f"http://localhost:8000/static/documents/{filename}"
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
            "url": submission.get("url") or submission.get("file_url") or (submission["content"] if submission["content"] and submission["content"].startswith("http") else None)
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
    from data_templates import REALISTIC_CASE_TITLES, get_all_case_titles
    
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
    upload_dir = "backend/uploads/licenses"
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
        "licenseId": licenseId,
        "licenseImageUrl": license_url
    }

    # --- 파운딩 멤버 혜택 자동 부여 ---
    try:
        from billing import set_founder_benefits, set_standard_trial, FOUNDER_LIMIT
    except ImportError:
        from backend.billing import set_founder_benefits, set_standard_trial, FOUNDER_LIMIT

    if len(LAWYERS_DB) < FOUNDER_LIMIT:
        set_founder_benefits(new_lawyer)
    else:
        set_standard_trial(new_lawyer)
    
    LAWYERS_DB.append(new_lawyer)
    save_lawyers_db(LAWYERS_DB)

    founder_msg = " 🚀 파운딩 멤버로 선정되었습니다! 6개월 무료 + 평생 50% 할인" if new_lawyer.get("is_founder") else ""
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
                    "lawyer_id": lawyer["id"],
                    "lawyer_name": lawyer["name"],
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
                    "lawyer_id": lawyer["id"],
                    "lawyer_name": lawyer["name"],
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
        summary = generate_youtube_summary(submission.url, submission.title)
        # Append summary to content body if empty, or just use it
        if not content_body:
            content_body = summary
    else:
        # Default summary
        summary = content_body[:100] + "..." if content_body else ""
        
    # (Prior logic for YouTube summary or default summary remains above)

        
    # --- Content Validation ---
    # 1. Length Check
    len_check = content_validator.validate_length(content_body, min_length=100) # relaxed for manual testing
    if not len_check["valid"]:
        raise HTTPException(status_code=400, detail=len_check["message"])

    # 2. Keyword Density (Extract from title first)
    target_keywords = seo.seo_generator.extract_keywords(submission.title)
    kw_check = content_validator.check_keyword_density(content_body, target_keywords)
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
    if submission.url and isinstance(submission.url, str) and submission.url.startswith("http"):
        if "jpg" in submission.url or "png" in submission.url:
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
    # Return lawyers who are NOT verified (verified is False or missing)
    # Note: Our mock data generator might not set 'verified' for old data, so assume True if missing for legacy data, 
    # but for new signups it is set to False.
    # Actually, for simplicity, let's look for explicit False.
    return [l for l in LAWYERS_DB if l.get("verified") is False]

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

@app.get("/api/admin/lawyers")
def get_all_lawyers_admin():
    return LAWYERS_DB

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
def get_all_lawyers(q: Optional[str] = None):
    if q:
        return [l for l in LAWYERS_DB if q.lower() in l["name"].lower() or q.lower() in l["id"].lower()]
    return LAWYERS_DB

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
            "dwell_time": round(metrics.dwell_time_avg, 1)
        })
    
    top_posts.sort(key=lambda x: x["views"], reverse=True)
    
    return {
        "total_views": total_views,
        "total_conversions": total_conversions,
        "avg_dwell_time": sum(m.dwell_time_avg for m in data.values()) / max(1, len(data)) if data else 0,
        "top_posts": top_posts[:5]
    }


# --- Case Upload & Parsing ---
try:
    from backend.case_parser_v2 import case_parser
    print("DEBUG: Successfully imported case_parser from backend.case_parser_v2")
except ImportError as e:
    print(f"DEBUG: Failed to import backend.case_parser_v2: {e}")
    try:
        from case_parser_v2 import case_parser
        print("DEBUG: Successfully imported case_parser from case_parser_v2")
    except ImportError as e2:
        print(f"DEBUG: Failed to import case_parser_v2: {e2}")
        # Re-raise to see the error in logs if both fail
        raise e2


try:
    from backend.seo import seo_generator
except ImportError:
    from seo import seo_generator

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
                    case_parser.log_debug(f"DEBUG: Duplicate PDF detected (Hash: {file_hash[:10]}...)")
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
        "summary": data.summary or data.story[:100] + "...",
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
    
    return {"message": "승소사례가 성공적으로 접수되었습니다. 관리자 승인 후 게시됩니다.", "case_id": case_id}


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
                    item["lawyer_name"] = lawyer["name"]
                if "lawyer_id" not in item:
                    item["lawyer_id"] = lawyer["id"]
                
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
                lawyer["suitability_score"] += 10
                
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
    from backend.cases import case_manager
except ImportError:
    from cases import case_manager

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

import json
import os
import uuid
import re
from datetime import datetime
from typing import List, Dict, Optional
from pydantic import BaseModel

CASES_FILE = "cases.json"

# Data Models
class Case(BaseModel):
    id: str
    lawyer_id: str
    client_name: str # PII
    client_phone: str # PII
    case_number: str # PII (e.g. 2023가합1234)
    judge_name: str # PII
    full_text: str # Original Text
    attached_files: List[str] = []
    internal_notes: str = ""
    submitted_at: str
    status: str = "pending" # pending, approved, rejected, revision_requested

class DeidCase(BaseModel):
    id: str
    original_case_id: str
    lawyer_id: str
    title: str
    summary: str
    tags: List[str]
    case_type: str # Civil, Criminal, etc.
    field: str # Divorce, Real Estate, etc.
    result: str # Won, Partial Win, etc.
    stage: str # 1st Trial, Appeal, etc.
    facts: List[str] = [] # Key facts
    legal_points: List[str] = [] # Legal arguments
    outcome_reason: str = ""
    deid_level: str = "auto" # auto, enhanced, manual
    is_public: bool = False
    view_count: int = 0
    approved_at: Optional[str] = None

# Mock Data Storage
class CaseManager:
    def __init__(self):
        self.cases: Dict[str, Case] = {}
        self.deid_cases: Dict[str, DeidCase] = {}
        self.load_data()

    def load_data(self):
        if os.path.exists(CASES_FILE):
            try:
                with open(CASES_FILE, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    for c_data in data.get("cases", []):
                        self.cases[c_data["id"]] = Case(**c_data)
                    for d_data in data.get("deid_cases", []):
                        self.deid_cases[d_data["id"]] = DeidCase(**d_data)
            except Exception as e:
                print(f"Error loading cases: {e}")
        else:
            self._generate_mock_data()

    def save_data(self):
        data = {
            "cases": [c.dict() for c in self.cases.values()],
            "deid_cases": [d.dict() for d in self.deid_cases.values()]
        }
        with open(CASES_FILE, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

    def _generate_mock_data(self):
        # Generate a few sample cases
        lawyer_id = "lawyer1@example.com"
        
        # Sample 1: Divorce (Approved)
        c1_id = str(uuid.uuid4())
        c1 = Case(
            id=c1_id,
            lawyer_id=lawyer_id,
            client_name="홍길동",
            client_phone="010-1234-5678",
            case_number="2023드합1005",
            judge_name="김판사",
            full_text="원고 홍길동은 피고 이몽룡을 상대로 이혼을 청구한다. 피고의 부정행위가 명백하고...",
            submitted_at=datetime.now().isoformat(),
            status="approved"
        )
        d1 = DeidCase(
            id=str(uuid.uuid4()),
            original_case_id=c1_id,
            lawyer_id=lawyer_id,
            title="배우자의 부정행위로 인한 이혼 및 위자료 청구 승소",
            summary="배우자의 부정행위 증거를 확보하여 이혼 및 위자료 3,000만원을 인정받은 사례",
            tags=["이혼", "부정행위", "위자료"],
            case_type="가사",
            field="이혼",
            result="승소",
            stage="1심",
            facts=["피고는 혼인 기간 중 부정행위를 저지름", "원고는 증거를 확보하여 소 제기"],
            legal_points=["민법 제840조 제1호에 해당함 입증", "재산분할 기여도 50% 주장"],
            outcome_reason="부정행위의 증거가 명백하고 혼인 파탄의 주된 책임이 피고에게 있음",
            is_public=True,
            approved_at=datetime.now().isoformat()
        )
        self.cases[c1_id] = c1
        self.deid_cases[d1.id] = d1

        # Sample 2: Criminal (Pending)
        c2_id = str(uuid.uuid4())
        c2 = Case(
            id=c2_id,
            lawyer_id=lawyer_id,
            client_name="김철수",
            client_phone="010-9876-5432",
            case_number="2024고단502",
            judge_name="이판사",
            full_text="피고인은 2024. 1. 1. 서울 강남구 역삼동 소재 도로에서 혈중알코올농도 0.1% 상태로 운전하다가...",
            submitted_at=datetime.now().isoformat(),
            status="pending"
        )
        d2 = DeidCase(
            id=str(uuid.uuid4()),
            original_case_id=c2_id,
            lawyer_id=lawyer_id,
            title="음주운전 초범 벌금형 선처 방어",
            summary="혈중알코올농도가 높았으나 초범이고 대리운전을 호출하려던 사정을 참작받음",
            tags=["형사", "음주운전", "도로교통법"],
            case_type="형사",
            field="교통범죄",
            result="벌금형",
            stage="1심",
            is_public=False
        )
        self.cases[c2_id] = c2
        self.deid_cases[d2.id] = d2
        
        self.save_data()

    # --- PII Detection ---
    def detect_pii(self, text: str) -> List[Dict]:
        warnings = []
        
        # Name Pattern (Simple 3 char Korean name) - High false positive potential, strictly illustrative
        # Regex: Look for typical name patterns masked or not. 
        # Actually checking for raw patterns in "De-identified" text.
        # RRN 
        if re.search(r"\d{6}-\d{7}", text):
            warnings.append({"type": "RRN", "msg": "주민등록번호 패턴이 감지되었습니다."})
        
        # Phone
        if re.search(r"010-\d{4}-\d{4}", text):
             warnings.append({"type": "PHONE", "msg": "휴대전화번호 패턴이 감지되었습니다."})
             
        # Case Number
        if re.search(r"\d{4}[가-힣]{1,3}\d+", text):
             warnings.append({"type": "CASE_NUM", "msg": "사건번호 패턴이 감지되었습니다."})

        # Specific names (Hard to do perfectly without NLP, using simple heuristic)
        # e.g. "홍길동"
        
        return warnings

    # --- CRUD Operations ---
    def get_all_cases_admin(self):
        # Return combined info for admin
        results = []
        for cid, case in self.cases.items():
            # Find associated deid case
            deid = next((d for d in self.deid_cases.values() if d.original_case_id == cid), None)
            results.append({
                "original": case.dict(),
                "deid": deid.dict() if deid else None,
                "pii_warnings": self.detect_pii(deid.summary + " " + (deid.outcome_reason or "")) if deid else []
            })
        return sorted(results, key=lambda x: x["original"]["submitted_at"], reverse=True)

    def get_my_cases(self, lawyer_id: str):
        results = []
        for cid, case in self.cases.items():
            if case.lawyer_id == lawyer_id:
                deid = next((d for d in self.deid_cases.values() if d.original_case_id == cid), None)
                results.append({
                    "original": case.dict(), # Lawyer only needs status mostly, but kept for consistency
                    "deid": deid.dict() if deid else None
                })
        return sorted(results, key=lambda x: x["original"]["submitted_at"], reverse=True)

    def get_archive_cases(self, query: str = None, field: str = None):
        results = []
        for deid in self.deid_cases.values():
            if not deid.is_public:
                continue
            
            # Filter Logic
            if field and deid.field != field:
                continue
            
            if query:
                q = query.lower()
                if (q not in deid.title.lower() and 
                    q not in deid.summary.lower() and 
                    q not in " ".join(deid.tags).lower()):
                    continue
            
            results.append(deid.dict())
        
        return sorted(results, key=lambda x: x["view_count"], reverse=True)

    def submit_case(self, lawyer_id: str, data: Dict):
        c_id = str(uuid.uuid4())
        # Original
        c = Case(
            id=c_id,
            lawyer_id=lawyer_id,
            client_name=data.get("client_name", ""),
            client_phone=data.get("client_phone", ""),
            case_number=data.get("case_number", ""),
            judge_name=data.get("judge_name", ""),
            full_text=data.get("full_text", ""),
            internal_notes=data.get("internal_notes", ""),
            submitted_at=datetime.now().isoformat(),
            status="pending"
        )
        # Initial De-identified draft (Auto-generated or provided)
        d = DeidCase(
            id=str(uuid.uuid4()),
            original_case_id=c_id,
            lawyer_id=lawyer_id,
            title=data.get("title", "무제"),
            summary=data.get("summary", ""),
            tags=data.get("tags", []),
            case_type=data.get("case_type", "기타"),
            field=data.get("field", "기타"),
            result=data.get("result", "미학정"),
            stage=data.get("stage", "1심"),
            is_public=False
        )
        self.cases[c_id] = c
        self.deid_cases[d.id] = d
        self.save_data()
        return d.dict()

    def update_status(self, case_id: str, status: str, feedback: str = None):
        if case_id in self.cases:
            self.cases[case_id].status = status
            
            # Find deid
            deid = next((d for d in self.deid_cases.values() if d.original_case_id == case_id), None)
            if deid:
                if status == "approved":
                    deid.is_public = True
                    deid.approved_at = datetime.now().isoformat()
                else:
                    deid.is_public = False
            
            self.save_data()
            return True
        return False

case_manager = CaseManager()

# pyright: reportGeneralTypeIssues=false, reportMissingImports=false, reportOptionalMemberAccess=false, reportOptionalSubscript=false, reportOptionalCall=false, reportArgumentType=false, reportIndexIssue=false, reportOperatorIssue=false, reportCallIssue=false, reportReturnType=false, reportAttributeAccessIssue=false, reportMissingModuleSource=false
# pyre-ignore-all-errors
"""
사건 자료 기반 AI 대화 (RAG Workspace)
─────────────────────────────────────────
PDF/Word 문서 업로드 → 텍스트 추출 → 3줄 요약 → 문맥 기반 AI 대화

MVP: 메모리 기반 세션 저장 (DB 불필요)
"""

from fastapi import APIRouter, UploadFile, File, Form  # type: ignore
from fastapi.responses import JSONResponse  # type: ignore
from pydantic import BaseModel  # type: ignore
from typing import List, Optional, Dict
import openai  # type: ignore
import os
import io
import fitz  # type: ignore  # PyMuPDF
from datetime import datetime
from uuid import uuid4

router = APIRouter(prefix="/api/case", tags=["case-workspace"])

# ── 메모리 기반 세션 저장소 ───────────────────────────────────
# key: session_id, value: { context, documents[], summary, created_at }
WORKSPACE_SESSIONS: Dict[str, dict] = {}


class ChatRequest(BaseModel):
    session_id: str
    message: str


class ChatResponse(BaseModel):
    reply: str
    session_id: str


# ── 텍스트 추출 유틸 ──────────────────────────────────────────
def extract_text_from_pdf(content: bytes) -> str:
    """PyMuPDF로 PDF에서 텍스트 추출"""
    doc = fitz.open(stream=content, filetype="pdf")
    texts = []
    for page in doc:
        texts.append(page.get_text())
    doc.close()
    return "\n".join(texts)


def extract_text_from_docx(content: bytes) -> str:
    """python-docx로 Word 문서에서 텍스트 추출"""
    try:
        from docx import Document  # type: ignore
        doc = Document(io.BytesIO(content))
        return "\n".join([p.text for p in doc.paragraphs if p.text.strip()])
    except ImportError:
        # python-docx 미설치 시 간단한 텍스트 추출 시도
        text = content.decode("utf-8", errors="ignore")
        return text


def extract_text(content: bytes, filename: str) -> str:
    """파일 확장자에 따라 적절한 추출기 사용"""
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""

    if ext == "pdf":
        return extract_text_from_pdf(content)
    elif ext in ("docx", "doc"):
        return extract_text_from_docx(content)
    elif ext == "txt":
        return content.decode("utf-8", errors="ignore")
    else:
        return ""


# ── System Prompts ────────────────────────────────────────────
SUMMARY_PROMPT = """너는 같은 팀 변호사야. 동료 변호사가 사건 자료를 공유했어.
핵심 내용을 정확히 3줄로 브리핑해 줘.

규칙:
1. 각 줄은 완결된 한 문장으로 작성
2. 법적 쟁점과 핵심 사실관계 중심
3. 동료에게 브리핑하듯 간결하게
4. "1. ", "2. ", "3. " 넘버링으로 시작
"""

CHAT_SYSTEM_PROMPT = """너는 "로날드"야. 10년차 수석 어소시에이트로, 사용자와 같은 로펌의 같은 팀에서 일하는 파트너다.

너의 핵심 정체성:
- 감정은 없고 논리만 있다. 불필요한 인사, 감정적 표현, 위로는 일절 하지 않는다.
- 방대한 기록을 초고속으로 검토하고, 판례를 뒤져 전략 초안을 짜는 게 너의 일이다.
- 의뢰인 편이 아니라 "팩트와 법리" 편이다. 불리한 사실도 정확히 짚는다.

너의 말투와 스타일:
- 간결하고 단도직입적. 군더더기 없는 브리핑 스타일.
- 결론부터 말하고, 근거를 구조화해서 정리한다.
- "~입니다", "~됩니다" 체를 사용하되, 동료니까 너무 딱딱하진 않게.
- 방어 가능성을 퍼센트로 제시한다 (예: "방어 가능성 약 70%").
- 리스크가 있으면 ⚠️ 표시로 명확히 경고한다.
- 관련 판례가 있으면 대법원 판례번호를 인용한다.

응답 구조 (이 형식을 따른다):
1. **결론** — 핵심 판단을 1~2문장으로
2. **근거/방어논리** — 번호 매겨서 구조화
3. **⚠️ 리스크** — 상대방이 공격할 수 있는 포인트
4. **보강 필요 증거** — 추가로 확보해야 할 자료

규칙:
- 업로드된 문서가 있다면 먼저 내용을 파악하고 분석 결과를 말할 것
- 문서가 없어도 사용자가 설명하는 사건에 대해 실질적으로 분석
- 감정적 표현 금지. "힘내세요", "걱정 마세요" 같은 말 절대 하지 마.
- 너무 길게 늘어놓지 말고, 핵심을 짚되 필요하면 구조화해서 정리
- 절대 "저는 AI입니다"라고 하지 마. 너는 로날드, 10년차 수석 어소시에이트다.
"""


# ── 문서 업로드 & 요약 엔드포인트 ─────────────────────────────
@router.post("/upload")
async def upload_case_documents(files: List[UploadFile] = File(...)):
    """
    사건 관련 문서를 업로드하면 텍스트를 추출하고
    세션에 저장한 뒤, 핵심 3줄 요약을 반환합니다.
    """
    if not files:
        return JSONResponse(status_code=400, content={"detail": "파일을 1개 이상 업로드해 주세요."})

    session_id = str(uuid4())[:12]  # type: ignore
    all_texts = []
    doc_info = []

    for file in files:
        try:
            content = await file.read()
            filename = file.filename or "unknown"
            text = extract_text(content, filename)

            if text.strip():
                all_texts.append(f"=== {filename} ===\n{text}")
                doc_info.append({
                    "name": filename,
                    "size": len(content),
                    "chars": len(text),
                })
                print(f"[Workspace] 📄 {filename}: {len(text)}자 추출")
            else:
                print(f"[Workspace] ⚠ {filename}: 텍스트 추출 실패")
                doc_info.append({
                    "name": filename,
                    "size": len(content),
                    "chars": 0,
                    "error": "텍스트 추출 불가"
                })
        except Exception as e:
            print(f"[Workspace] ❌ {file.filename} 처리 실패: {e}")
            continue

    if not all_texts:
        return JSONResponse(status_code=400, content={
            "detail": "텍스트를 추출할 수 있는 문서가 없습니다. PDF 또는 Word 파일을 업로드해 주세요."
        })

    merged_context = "\n\n".join(all_texts)

    # 컨텍스트 길이 제한 (o1 토큰 한도 고려)
    max_chars = 80000
    if len(merged_context) > max_chars:
        merged_context = merged_context[:max_chars] + "\n\n... (이하 생략: 문서가 너무 길어 일부만 분석합니다)"  # type: ignore

    # 3줄 요약 생성
    summary = ""
    try:
        client = openai.OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        response = client.chat.completions.create(
            model="o1",
            messages=[
                {"role": "developer", "content": SUMMARY_PROMPT},
                {"role": "user", "content": f"다음 사건 관련 문서를 분석하고 핵심 내용 3줄 요약을 작성해 줘:\n\n{merged_context[:15000]}"}  # type: ignore
            ],
            max_completion_tokens=500,
        )
        summary = response.choices[0].message.content or ""
        print(f"[Workspace] ✅ 요약 완료: {summary[:80]}...")
    except Exception as e:
        print(f"[Workspace] ⚠ 요약 생성 실패: {e}")
        summary = "1. 문서가 업로드되었습니다.\n2. AI 요약을 생성하지 못했습니다.\n3. 채팅을 통해 문서 내용을 질문해 주세요."

    # 세션 저장
    WORKSPACE_SESSIONS[session_id] = {
        "context": merged_context,
        "documents": doc_info,
        "summary": summary,
        "chat_history": [],
        "created_at": datetime.now().isoformat(),
    }

    print(f"[Workspace] 🗂 세션 [{session_id}] 생성 완료 ({len(doc_info)}개 문서, {len(merged_context)}자)")

    return {
        "session_id": session_id,
        "documents": doc_info,
        "summary": summary,
        "total_chars": len(merged_context),
    }


# ── AI 대화 엔드포인트 ────────────────────────────────────────
@router.post("/chat", response_model=ChatResponse)
async def case_chat(request: ChatRequest):
    """
    사건 자료 컨텍스트를 바탕으로 사용자의 법률 질문에 AI가 답변합니다.
    문서를 업로드하지 않아도, 채팅만으로 사건을 논의할 수 있습니다.
    """
    session_id = request.session_id

    # 세션이 없으면 빈 세션을 자동 생성 (문서 없이 대화 가능)
    if not session_id or session_id not in WORKSPACE_SESSIONS:
        session_id = str(uuid4())[:12]  # type: ignore
        WORKSPACE_SESSIONS[session_id] = {
            "context": "",
            "documents": [],
            "summary": "",
            "chat_history": [],
            "created_at": datetime.now().isoformat(),
        }
        print(f"[Workspace] 🆕 문서 없이 새 세션 [{session_id}] 자동 생성")

    session = WORKSPACE_SESSIONS[session_id]
    context = session.get("context", "")
    chat_history = session.get("chat_history", [])

    # 시스템 프롬프트 구성
    if context:
        developer_msg = CHAT_SYSTEM_PROMPT + f"\n\n[사건 자료 컨텍스트]\n\n{context[:30000]}"
    else:
        developer_msg = CHAT_SYSTEM_PROMPT + "\n\n[참고: 업로드된 사건 자료가 없습니다. 사용자가 채팅으로 설명하는 사건 내용을 바탕으로 답변해 주세요.]"

    messages = [
        {"role": "developer", "content": developer_msg},
    ]

    # 이전 대화 추가
    for msg in chat_history[-10:]:
        messages.append(msg)

    # 현재 질문 추가
    messages.append({"role": "user", "content": request.message})

    try:
        client = openai.OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        response = client.chat.completions.create(
            model="o1",
            messages=messages,
            max_completion_tokens=2000,
        )

        reply = response.choices[0].message.content or ""

        # 대화 히스토리에 추가
        chat_history.append({"role": "user", "content": request.message})
        chat_history.append({"role": "assistant", "content": reply})
        session["chat_history"] = chat_history

        print(f"[Workspace] 💬 세션 [{session_id}] 대화 ({len(chat_history) // 2}번째)")

        return ChatResponse(  # type: ignore
            reply=reply,
            session_id=session_id,
        )

    except Exception as e:
        print(f"[Workspace] ❌ 대화 실패: {e}")
        return JSONResponse(status_code=500, content={
            "detail": f"AI 응답 생성 중 오류가 발생했습니다: {str(e)}"
        })

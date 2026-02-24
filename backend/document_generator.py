"""
AI 내용증명 초안 자동 생성기
────────────────────────────
변호사의 단순 문서 작업 시간을 획기적으로 줄여주는 킬러 기능.
OpenAI를 사용해 정식 내용증명 문서를 자동 생성합니다.
"""

from fastapi import APIRouter  # type: ignore
from pydantic import BaseModel  # type: ignore
from typing import Optional, List
import openai  # type: ignore
import os
import json
from datetime import datetime

router = APIRouter(prefix="/api", tags=["document-generator"])


# ── Request / Response 모델 ──────────────────────────────────
class NoticeRequest(BaseModel):
    sender_name: str          # 발신인 이름
    sender_address: str       # 발신인 주소
    sender_phone: Optional[str] = ""      # 발신인 연락처
    recipient_name: str       # 수신인 이름
    recipient_address: str    # 수신인 주소
    recipient_phone: Optional[str] = ""   # 수신인 연락처
    facts: str                # 핵심 사실관계 및 요구사항


class NoticeResponse(BaseModel):
    document: str             # 생성된 내용증명 텍스트 (전문)
    title: str                # 제목 (예: 임대차 보증금 반환청구)
    paragraphs: List[str]     # 본문 단락들 (번호 매기기용)
    model_used: str           # 사용된 모델
    generated_at: str         # 생성 시각


# ── System Prompt ─────────────────────────────────────────────
SYSTEM_PROMPT = """너는 한국의 10년 차 전문 변호사야. 주어진 사실관계를 바탕으로 정식 '내용증명' 본문을 작성해 줘.

반드시 아래 JSON 형식으로 응답해야 해:

{
  "title": "내용증명의 제목 (예: 임대차 보증금 반환청구, 약정금 이행 청구 등)",
  "paragraphs": [
    "1. 귀하(수신인, 이하 '귀하'라고 한다)의 무궁한 발전을 기원합니다.",
    "2. 본 발신인은 귀하와 아래와 같이 ... (사실관계 기술)",
    "3. 본 발신인은 귀하에게 ... (요구사항과 법적 근거)",
    "4. 본 발신인이 귀하에게 위와 같은 법적 조치를 취하기 전에 ... (마무리 경고)"
  ]
}

각 paragraph 작성 규칙:
- 각 단락은 "1.", "2.", "3.", "4." 등 번호로 시작해
- 하위 항목은 "가.", "나.", "다." 로 구분해
- 총 3~5개 단락이 적절해
- 첫 단락은 반드시 인사말: "귀하(수신인, 이하 '귀하'라고 한다)의 무궁한 발전을 기원합니다."
- 두 번째 단락부터 사실관계를 구체적으로 기술
- 마지막 단락은 반드시 기한 내 이행을 촉구하는 마무리

톤앤매너:
- 격식체(합니다체) 사용
- 감정적 표현 배제, 법적 근거 중심
- 정중하지만 단호한 어조
- 관련 법 조문이 있으면 구체적으로 인용 (민법 제○○○조, 민사집행법 제○○○조 등)
- 소멸시효, 지연손해금 등 법적 효과도 명시
- 소송촉진등에관한특례법 제3조 제1항 등 실무에서 자주 인용하는 조문 활용

중요: 반드시 유효한 JSON으로만 응답하고, JSON 외의 텍스트는 포함하지 마."""


# ── API 엔드포인트 ────────────────────────────────────────────
@router.post("/generate-notice", response_model=NoticeResponse)
def generate_notice(request: NoticeRequest):
    """내용증명 초안을 AI로 자동 생성합니다."""

    client = openai.OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

    today = datetime.now().strftime("%Y년 %m월 %d일")

    user_prompt = f"""아래 정보를 바탕으로 내용증명 본문을 작성해 주세요.

[발신인 정보]
- 성명: {request.sender_name}
- 주소: {request.sender_address}
- 연락처: {request.sender_phone or '(미기재)'}

[수신인 정보]
- 성명: {request.recipient_name}
- 주소: {request.recipient_address}
- 연락처: {request.recipient_phone or '(미기재)'}

[오늘 날짜]
{today}

[핵심 사실관계 및 요구사항]
{request.facts}
"""

    try:
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt}
            ],
            response_format={"type": "json_object"},
            temperature=0.3,
            max_tokens=3000,
        )

        raw = response.choices[0].message.content or "{}"
        data = json.loads(raw)

        title = data.get("title", "내용증명")
        paragraphs = data.get("paragraphs", [])

        # 전문 텍스트 조합 (호환용)
        full_text = f"내 용 증 명\n\n제목: {title}\n\n내  용\n\n"
        full_text += "\n\n".join(paragraphs)
        full_text += f"\n\n작성일자: {today}\n발신인: {request.sender_name}"

        print(f"[DocumentGen] ✅ 내용증명 생성 완료 ({len(full_text)}자, {len(paragraphs)}단락)")

        return NoticeResponse(  # type: ignore
            document=full_text,  # type: ignore
            title=title,  # type: ignore
            paragraphs=paragraphs,  # type: ignore
            model_used="gpt-4o",  # type: ignore
            generated_at=today  # type: ignore
        )

    except Exception as e:
        print(f"[DocumentGen] ❌ 생성 실패: {e}")
        from fastapi.responses import JSONResponse  # type: ignore
        return JSONResponse(   # type: ignore
            status_code=500,
            content={"detail": f"내용증명 생성 중 오류가 발생했습니다: {str(e)}"}
        )

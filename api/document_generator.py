"""
AI 내용증명 초안 자동 생성기
────────────────────────────
변호사의 단순 문서 작업 시간을 획기적으로 줄여주는 킬러 기능.
OpenAI o1을 사용해 정식 내용증명 문서를 자동 생성합니다.
"""

from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
import openai
import os
from datetime import datetime

router = APIRouter(prefix="/api", tags=["document-generator"])


# ── Request / Response 모델 ──────────────────────────────────
class NoticeRequest(BaseModel):
    sender_name: str          # 발신인 이름
    sender_address: str       # 발신인 주소
    sender_phone: Optional[str] = ""      # 발신인 연락처
    recipient_name: str       # 수신인 이름
    recipient_address: str    # 수신인 주소
    facts: str                # 핵심 사실관계 및 요구사항


class NoticeResponse(BaseModel):
    document: str             # 생성된 내용증명 텍스트
    model_used: str           # 사용된 모델
    generated_at: str         # 생성 시각


# ── System Prompt ─────────────────────────────────────────────
SYSTEM_PROMPT = """너는 한국의 10년 차 전문 변호사야. 주어진 사실관계를 바탕으로 정식 '내용증명' 초안을 작성해 줘.

반드시 아래 양식에 맞춰 작성해야 해:

1. **제목**: "내 용 증 명" (가운데 정렬, 공백 포함)
2. **수신인 정보**: 수신인 성명, 주소
3. **발신인 정보**: 발신인 성명, 주소, 연락처
4. **인사말**: "귀하의 무궁한 발전을 기원합니다."로 시작
5. **사실관계 요약**: 제공된 핵심 사실관계를 법적 용어를 사용하여 정리하되, 감정적 표현은 배제하고 객관적 사실만 기술
6. **요구사항**: 구체적인 요구사항과 이행 기한(본 내용증명 수령일로부터 7일 이내 등)
7. **법적 조치 예고**: "상기 기간 내 이행이 되지 않을 경우, 민·형사상 법적 조치를 취할 것임을 통보합니다." 등
8. **발신 일자**: 오늘 날짜
9. **발신인 서명**: "위 발신인 [이름] (서명 또는 날인)"

톤앤매너:
- 격식체(합니다체) 사용
- 감정적 표현 배제, 법적 근거 중심
- 정중하지만 단호한 어조
- 한국 법조계에서 실제로 사용하는 내용증명 양식을 충실히 따를 것

중요: 마크다운 기호(##, **, - 등)를 절대 사용하지 마. 일반 텍스트로만 작성해."""


# ── API 엔드포인트 ────────────────────────────────────────────
@router.post("/generate-notice", response_model=NoticeResponse)
def generate_notice(request: NoticeRequest):
    """내용증명 초안을 AI로 자동 생성합니다."""

    client = openai.OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

    today = datetime.now().strftime("%Y년 %m월 %d일")

    user_prompt = f"""아래 정보를 바탕으로 내용증명 초안을 작성해 주세요.

[발신인 정보]
- 성명: {request.sender_name}
- 주소: {request.sender_address}
- 연락처: {request.sender_phone or '(미기재)'}

[수신인 정보]
- 성명: {request.recipient_name}
- 주소: {request.recipient_address}

[오늘 날짜]
{today}

[핵심 사실관계 및 요구사항]
{request.facts}
"""

    try:
        response = client.chat.completions.create(
            model="o1",
            messages=[
                {"role": "developer", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt}
            ],
            max_completion_tokens=3000,
        )

        document_text = response.choices[0].message.content or ""

        print(f"[DocumentGen] ✅ 내용증명 생성 완료 ({len(document_text)}자)")

        return NoticeResponse(
            document=document_text,
            model_used="o1",
            generated_at=today
        )

    except Exception as e:
        print(f"[DocumentGen] ❌ 생성 실패: {e}")
        from fastapi.responses import JSONResponse
        return JSONResponse(
            status_code=500,
            content={"detail": f"내용증명 생성 중 오류가 발생했습니다: {str(e)}"}
        )

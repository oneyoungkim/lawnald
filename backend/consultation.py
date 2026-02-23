from openai import OpenAI
import json
import os
from typing import Dict, List, Optional
from pydantic import BaseModel

# Initialize OpenAI client
api_key = os.environ.get("OPENAI_API_KEY")
client = None

if not api_key:
    print("⚠️ OPENAI_API_KEY 환경변수가 설정되지 않았습니다. .env 파일을 확인하세요.")

if api_key:
    try:
        client = OpenAI(api_key=api_key)
    except Exception as e:
        print(f"Failed to initialize OpenAI client in consultation.py: {e}")
        client = None


class ConsultationAnalysis(BaseModel):
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

def analyze_consultation_text(text: str) -> Dict:
    """
    Analyzes the consultation text using LLM to extract structured data.
    """
    system_prompt = """
    You are an AI legal assistant for a lawyer. Analyze the consultation note/transcript and provide a structured summary.

    Output MUST be a valid JSON object with the following fields:
    - case_title: string (Short, descriptive title, e.g., "남편의 부정행위로 인한 이혼 소송")
    - primary_area: One of [가사, 형사, 민사, 부동산, 행정, 노동, 의료, 기타]
    - confidence: float (0.0 to 1.0)
    - summary: string (5-8 sentences, professional tone)
    - key_facts: list of strings (Max 8 key facts)
    - key_issues: list of strings (Max 6 key legal issues)
    - missing_questions: list of strings (Max 6 questions to ask the client)
    - checklist: list of strings (Max 10 preparation items/actions)
    - risk_notes: list of strings (Max 5 potential risks or cautions)
    - next_steps: list of strings (Max 6 practical next steps for the lawyer)

    Rules:
    1. Language: Korean (Formal/Professional).
    2. Do NOT give definitive legal advice or win probability.
    3. Focus on organizing facts and creating a to-do list for the lawyer.
    4. "primary_area" must be exactly one of the provided categories.
    """

    if not client:
        print("OpenAI 클라이언트가 초기화되지 않았습니다. 모의 데이터를 반환합니다.")
        return {
            "case_title": "분석 불가 (API 키 누락)",
            "primary_area": "기타",
            "confidence": 0.0,
            "summary": "서버에 OpenAI API 키가 설정되지 않아 내용을 분석할 수 없습니다. 시스템 관리자에게 문의하거나 환경 변수를 확인해주세요.",
            "key_facts": ["API 키 설정 필요"],
            "key_issues": ["시스템 설정 오류"],
            "missing_questions": [],
            "checklist": ["서버 환경 변수 OPENAI_API_KEY 설정 확인"],
            "risk_notes": ["자동 분석 기능을 사용할 수 없습니다."],
            "next_steps": ["API 키 발급 및 설정"]
        }

    try:
        response = client.chat.completions.create(
            model="o1",
            messages=[
                {"role": "developer", "content": system_prompt},
                {"role": "user", "content": text}
            ],
            response_format={"type": "json_object"},
        )
        
        content = response.choices[0].message.content
        return json.loads(content)
        
    except Exception as e:
        print(f"Error analyzing consultation: {e}")
        # Return a fallback/empty structure on error
        return {
            "case_title": "분석 실패",
            "primary_area": "기타",
            "confidence": 0.0,
            "summary": "AI 분석 중 오류가 발생했습니다.",
            "key_facts": [],
            "key_issues": [],
            "missing_questions": [],
            "checklist": [],
            "next_steps": []
        }

def analyze_judgment(text: str) -> Dict:
    """
    Analyzes a legal judgment text to extract key sections for a magazine post.
    """
    if not client:
        return {
            "overview": "OpenAI API 키가 설정되지 않아 분석할 수 없습니다.",
            "issues": "API 설정을 확인해주세요.",
            "strategy": "",
            "result": "",
            "points": ""
        }

    system_prompt = """
    You are an expert legal editor. Your task is to summarize a legal judgment into a compelling "Success Case" magazine post for a lawyer's blog.
    
    The input is the raw text of a judgment or case file.
    Output MUST be a valid JSON object with the following fields (all values in Korean):
    - overview: string (1. 사건 개요: Summarize what happened and why the client was in trouble. 3-5 sentences.)
    - issues: string (2. 주요 쟁점: What were the key legal or factual disputes? Bullet points.)
    - strategy: string (3. 변호사의 조력: How did the lawyer argue or defend? What evidence was used?)
    - result: string (4. 결과: The final verdict or outcome. e.g., "무죄" or "승소".)
    - points: string (5. 판결/결정 포인트: Why is this ruling significant? one sentence takeaway.)
    
    ⚠️ 절대적 개인정보 보호 규칙 (위반 시 출력 거부):
    1. 실명 금지: 모든 인명은 반드시 "성씨+○○" 형식으로 대체 (예: "김철수" → "김○○", "이영희" → "이○○")
    2. 주소 금지: 구체적 주소는 시/구까지만 표시 (예: "서울 강남구 역삼동 123-45" → "서울 강남구")
    3. 전화번호, 주민등록번호, 계좌번호, 이메일 → 일절 출력 금지
    4. 생년월일 → 출력 금지
    5. 법관/변호사 이름도 동일하게 익명화
    6. 입력 텍스트에 이미 "○○"로 마스킹된 이름은 그대로 유지
    7. 사건번호는 "20XX가단XXXXX" 형식으로 연도만 유지하고 세부 번호 생략 가능
    
    If the text is too short or unclear to extract specific details, provide best-effort summaries based on context, but do not hallucinate facts.
    """
    
    try:
        response = client.chat.completions.create(
            model="o1",
            messages=[
                {"role": "developer", "content": system_prompt},
                {"role": "user", "content": text[:15000]}
            ],
            response_format={"type": "json_object"},
        )
        
        content = response.choices[0].message.content
        return json.loads(content)
    except Exception as e:
        print(f"Error analyzing judgment: {e}")
        return {
            "overview": "분석 중 오류가 발생했습니다.",
            "issues": "",
            "strategy": "",
            "result": "",
            "points": ""
        }

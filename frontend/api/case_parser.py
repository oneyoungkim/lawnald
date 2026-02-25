
import pdfplumber
import re
import json
from typing import Dict, Any, List, Optional, Tuple
try:
    from seo import pii_masker
except ImportError:
    try:
        from seo import pii_masker
    except ImportError:
        import sys
        import os
        sys.path.append(os.path.dirname(os.path.abspath(__file__)))
        from seo import pii_masker

# 한국 주요 성씨 (상위 100개)
KOREAN_SURNAMES = (
    "김이박최정강조윤장임한오서신권황안송류전홍고문양손배백허유남심노하"
    "곽성차주우구신임나진지엄채원천방공강현함변염석선설마위표명기반왕"
    "금옥육인맹제모탁국여추"
)

def detect_real_names(text: str) -> List[Dict[str, Any]]:
    """
    한국어 실명 패턴을 감지합니다.
    Returns: [{"name": "홍길동", "start": 10, "end": 13}, ...]
    """
    found = []
    # 2~4자 한글 이름 패턴 (성씨 + 1~3자 이름)
    pattern = re.compile(r'(?<![가-힣])([' + KOREAN_SURNAMES + r'][가-힣]{1,3})(?![가-힣])')
    
    # 제외할 일반 단어 (오탐 방지)
    EXCLUDE_WORDS = {
        "원고", "피고", "법원", "판사", "변호", "사건", "항소", "상고", "피해", "혐의",
        "증거", "주장", "진술", "판결", "선고", "기각", "인용", "취소", "무죄", "유죄",
        "집행", "유예", "벌금", "형사", "민사", "행정", "가사", "이혼", "상속", "채권",
        "채무", "손해", "배상", "계약", "해지", "위반", "처분", "결정", "명령",
        "신청", "청구", "소송", "재판", "공판", "검찰", "경찰", "수사", "기소",
        "공소", "항변", "증인", "감정", "조사", "심리", "변론", "최종", "확정",
        "의뢰", "전문", "사무", "법률", "조항", "규정", "적용", "해석", "이유",
        "결론", "서론", "본문", "성공", "전략", "대응", "승소", "패소", "합의",
        "조정", "화해", "강제", "임의", "가압", "가처", "본압", "집행", "보전",
        "로날", "에디", "파트", "블로", "포스", "콘텐", "매거", "인사",
        "의뢰인", "피고인", "원고인", "피해자", "가해자", "참고인",
        "비공개", "익명처", "마스킹", "변호사", "로날드",
    }
    
    for m in pattern.finditer(text):
        name = m.group(1)
        if name not in EXCLUDE_WORDS and len(name) >= 2:
            # 추가 필터: 앞뒤 문맥으로 이름인지 판단
            found.append({
                "name": name,
                "start": m.start(1),
                "end": m.end(1)
            })
    
    # 중복 제거 (같은 이름)
    seen = set()
    unique = []
    for item in found:
        if item["name"] not in seen:
            seen.add(item["name"])
            unique.append(item)
    
    return unique

def mask_real_names(text: str) -> Tuple[str, List[str]]:
    """
    텍스트에서 실명을 감지하고 마스킹합니다.
    Returns: (masked_text, list_of_detected_names)
    """
    detected = detect_real_names(text)
    masked = text
    detected_names = []
    
    # 긴 이름부터 치환 (부분 매칭 방지)
    for item in sorted(detected, key=lambda x: len(x["name"]), reverse=True):
        name = item["name"]
        surname = name[0]
        # A씨, B씨 형태로 치환
        replacement = f"{surname}OO"
        if name not in detected_names:
            detected_names.append(name)
        masked = masked.replace(name, replacement)
    
    return masked, detected_names

class CaseParser:
    def __init__(self):
        pass

    def extract_text_from_pdf(self, file_path: str) -> str:
        """
        Extract raw text from PDF using pdfplumber for better layout handling.
        """
        text = ""
        try:
            with pdfplumber.open(file_path) as pdf:
                for page in pdf.pages:
                    page_text = page.extract_text()
                    if page_text:
                        text += page_text + "\n"
        except Exception as e:
            print(f"Error reading PDF {file_path}: {e}")
            return ""
        return text

    # Lawnald Senior Legal Editor 프롬프트
    LAWNALD_PROMPT = """# Role: Lawnald Senior Legal Editor
당신은 대한민국 최고의 법률 IT 플랫폼 '로날드(Lawnald)'의 수석 법률 에디터입니다.
변호사가 업로드한 판결문을 분석하여, 일반인이 이해하기 쉽고 신뢰감을 느끼는 고퀄리티 '승소 사례 리포트'를 생성하는 것이 당신의 임무입니다.

# Task Process
1. **De-identification (비식별화):**
   - 모든 개인정보(성명, 주소, 계좌번호, 상세 지명, 차량번호 등)를 [비공개] 또는 'A씨', 'B법인' 등으로 완벽하게 치환하십시오.
   - 법원 명칭과 사건번호 뒷자리는 'OO지방법원', '202X고단OOOOO' 식으로 처리하여 익명성을 보장하십시오.

2. **Legal Insight Extraction (법리 추출):**
   - 사건의 쟁점(Issue)을 파악하십시오.
   - 변호인이 제출한 핵심 증거와 법리적 주장을 찾아내십시오.
   - 재판부가 승소(무죄, 기각 포함) 판결을 내린 결정적인 이유(Rationale)를 분석하십시오.

3. **Content Creation (콘텐츠 생성):**
   - 추출된 데이터를 바탕으로 아래 Output Format에 맞춰 블로그 포스팅을 작성하십시오.

# Tone & Manner (로날드 스타일)
- **전문성:** 법률 용어를 정확히 사용하되, 문맥 안에서 자연스럽게 풀이하십시오.
- **신뢰감:** "최선을 다했다"는 감성적 호소보다 "어떤 법리로 이겼다"는 논리적 근거에 집중하십시오.
- **가독성:** 문장은 짧고 명확하게 끊어 쓰고, 불필요한 이모지 사용은 자제하십시오.

# CRITICAL: 실명 비식별화
- 판결문에 등장하는 모든 실명(원고, 피고, 증인, 관계인 등)은 반드시 A씨, B씨, C법인 등으로 치환하십시오.
- 변호사 본인의 이름도 '로날드 파트너 변호사' 등으로 치환하십시오.
- 주소, 전화번호, 계좌번호 등 개인정보는 [비공개]로 처리하십시오.

# Output Format (strict JSON)
{{
  "title": "[성공사례] (사건 키워드) - (결과) (예: [성공사례] 음주운전 재범 혐의, '이것' 증명하여 집행유예 이끌어냈습니다)",
  "introduction": "의뢰인이 처했던 절박한 상황 요약 (2~3문장)",
  "strategy": "로날드 파트너 변호사만의 차별화된 대응 논리. 핵심 증거와 법리적 주장을 구체적으로 서술 (3~5문단)",
  "verdict": "재판부의 판단. 판결의 의의 및 동일한 고민을 가진 잠재 의뢰인에게 주는 조언 (2~3문단)",
  "client_story": "위 내용을 하나로 합친 완성된 블로그 포스팅 전문 (서론+본문+결론, 1000~1500자)",
  "ai_tags": "검색 키워드 (쉼표 구분, 예: 음주운전, 집행유예, 혈중알코올)",
  "detected_names": ["홍길동", "김철수"] // 원문에서 발견된 실명 리스트 (마스킹 전 원본)
}}

판결문 텍스트:
{text}
"""

    def parse_structure(self, text: str) -> Dict[str, Any]:
        """
        판결문 텍스트를 분석하여 구조화된 승소사례 데이터를 생성합니다.
        Lawnald Senior Legal Editor 프롬프트 + GPT-4o 사용.
        """
        # 1. 사건번호/법원 추출
        case_no = ""
        case_pattern = r"\d{4}[가-힣]+\d+"
        match = re.search(case_pattern, text)
        if match:
            case_no = match.group(0)
        
        # 법원 추출
        court = "법원"
        court_pattern = r"[가-힣]+(지방|고등|대)법원([가-힣]*지원)?"
        court_match = re.search(court_pattern, text)
        if court_match:
            court = court_match.group(0)
        
        # 2. AI 분석
        title = ""
        introduction = ""
        strategy = ""
        verdict = ""
        client_story = ""
        ai_tags_summary = ""
        ai_detected_names: List[str] = []
        
        try:
            try:
                from search import client as openai_client
            except ImportError:
                from search import client as openai_client
            
            if openai_client:
                prompt = self.LAWNALD_PROMPT.format(text=text[:8000])
                
                response = openai_client.chat.completions.create(
                    model="gpt-4o",
                    messages=[
                        {"role": "system", "content": "You are Lawnald's Senior Legal Editor. Always respond in Korean. Output strict JSON."},
                        {"role": "user", "content": prompt}
                    ],
                    response_format={"type": "json_object"},
                    temperature=0.3
                )
                content = response.choices[0].message.content
                data = json.loads(content)
                
                title = data.get("title", "")
                introduction = data.get("introduction", "")
                strategy = data.get("strategy", "")
                verdict = data.get("verdict", "")
                client_story = data.get("client_story", "")
                ai_tags_summary = data.get("ai_tags", "")
                ai_detected_names = data.get("detected_names", [])
                
        except Exception as e:
            error_msg = f"AI Extraction failed: {e}"
            print(error_msg)
            try:
                with open("parsing_debug.log", "a", encoding="utf-8") as f:
                    f.write(error_msg + "\n")
            except: pass

            title = "[성공사례] 승소 사례"
            introduction = "의뢰인은 어려운 법적 상황에 처해 있었습니다."
            strategy = "변호인의 치밀한 법리 분석을 통해 대응하였습니다."
            verdict = "재판부는 변호인 측 주장을 인용하였습니다."
            client_story = (
                "본 사건은 의뢰인이 어려운 법적 상황에 처한 사안이었습니다. "
                "변호인의 치밀한 법리 분석 끝에 승소를 이끌어낼 수 있었습니다.\n"
                f"(AI 분석 실패: {str(e)})"
            )
            ai_tags_summary = "승소, 법률"

        # 3. 실명 2차 검출 (AI가 놓친 것 추가 감지)
        regex_detected = detect_real_names(client_story)
        regex_names = [d["name"] for d in regex_detected]
        all_detected_names = list(set(ai_detected_names + regex_names))
        
        # 4. client_story에서 실명 마스킹
        masked_story, _ = mask_real_names(client_story)
        
        structured = {
            "case_number": case_no,
            "court": court,
            "full_text": text,
            "title": title,
            "introduction": introduction,
            "strategy": strategy,
            "verdict": verdict,
            "client_story": masked_story,
            "client_story_raw": client_story,  # 마스킹 전 원본 (관리자 확인용)
            "ai_tags": ai_tags_summary,
            "summary": introduction,
            "detected_names": all_detected_names,  # 감지된 실명 리스트
            "has_name_warning": len(all_detected_names) > 0
        }
        
        return structured

    def parse_from_images(self, file_path: str) -> Dict[str, Any]:
        """
        Fallback method: Parse structured data from PDF images using GPT-4o Vision.
        Used when text extraction fails (scanned PDFs).
        """
        import base64
        print(f"DEBUG: Entering parse_from_images for {file_path}")
        # 1. Convert PDF to Images (Max 5 pages)
        images_b64 = []
        try:
            print("DEBUG: Attempting import fitz")
            try:
                import fitz  # PyMuPDF
                print("DEBUG: import fitz success")
            except ImportError:
                print("DEBUG: import fitz failed, trying pymupdf")
                import pymupdf as fitz
                print("DEBUG: import pymupdf success")

            doc = fitz.open(file_path)
            for i in range(min(5, len(doc))):
                page = doc.load_page(i)
                pix = page.get_pixmap()
                img_data = pix.tobytes("png")
                b64 = base64.b64encode(img_data).decode("utf-8")
                images_b64.append(b64)
        except ImportError as e:
            import sys
            error_details = f"ImportError: {e}\nSys Exec: {sys.executable}\nSys Path: {sys.path}"
            print(error_details)
            return self._get_fallback_mock_data(f"PyMuPDF 모듈 로드 실패. (서버 로그 확인 필요) {e}")
        except Exception as e:
            print(f"Image conversion failed: {e}")
            return self._get_fallback_mock_data(f"이미지 변환 오류: {type(e).__name__}: {e}")

        # 2. Call GPT-4o Vision
        try:
            try:
                from search import client as openai_client
            except ImportError:
                from search import client as openai_client
            
            if not openai_client:
                raise ImportError("OpenAI client not available")

            # Prepare image content blocks
            content_blocks = [
                {"type": "text", "text": "Analyze these pages of a Korean legal judgment and extract structured data."}
            ]
            for b64 in images_b64:
                content_blocks.append({
                    "type": "image_url",
                    "image_url": {"url": f"data:image/png;base64,{b64}"}
                })
            
            # Prompt instructions (same structure as text version)
            valid_json_instruction = """
            Output STRICT JSON format:
            {
                "case_number": "Extract from header (e.g. 2024가단12345)",
                "court": "Court name",
                "facts": "Detailed background",
                "issues": "Main legal disputes (bullet points)",
                "reasoning": "Court's reasoning",
                "conclusion": "Final ruling",
                "client_story": "Narrative summary for layperson (500 chars)",
                "ai_tags": "Keywords (comma separated)"
            }
            """
            content_blocks[0]["text"] += valid_json_instruction

            response = openai_client.chat.completions.create(
                model="gpt-4o",
                messages=[{"role": "user", "content": content_blocks}],
                response_format={"type": "json_object"},
                temperature=0.0
            )
            
            content = response.choices[0].message.content
            import json
            data = json.loads(content)
            
            return {
                "case_number": data.get("case_number", ""),
                "court": data.get("court", ""),
                "full_text": "(Scanned PDF - Text extracted via AI Vision)",
                "facts": data.get("facts", ""), 
                "issues": data.get("issues", ""),
                "reasoning": data.get("reasoning", ""),
                "conclusion": data.get("conclusion", ""),
                "client_story": data.get("client_story", ""),
                "ai_tags": data.get("ai_tags", ""),
                "summary": data.get("client_story", "")
            }

        except Exception as e:
            print(f"Vision Parsing failed: {e}")
            return self._get_fallback_mock_data(f"Vision 오류: {str(e)}")

    def _get_fallback_mock_data(self, error_msg: str) -> Dict[str, Any]:
        return {
            "case_number": "미식별",
            "court": "미식별",
            "full_text": f"분석 실패: {error_msg}",
            "facts": "내용을 추출할 수 없습니다.",
            "issues": "스캔 상태를 확인해주세요.",
            "reasoning": "",
            "conclusion": "",
            "client_story": "문서 분석에 실패했습니다. (이미지 화질이 낮거나 암호화된 문서일 수 있습니다.)",
            "ai_tags": "분석실패",
            "summary": "분석 실패"
        }

    def anonymize_additional(self, text: str) -> str:
        """
        판결문 전용 비식별화.
        PII + 실명 + 사건번호 마스킹.
        """
        # 1. Basic PII
        masked = pii_masker.mask(text)
        
        # 2. 실명 마스킹
        masked, _ = mask_real_names(masked)
        
        # 3. 사건번호 마스킹
        case_pattern = r"\d{4}[가-힣]+\d+"
        masked = re.sub(case_pattern, "202X**OOOOO", masked)
        
        return masked

    def log_debug(self, msg: str):
        """디버그 로깅"""
        print(msg)
        try:
            with open("parsing_debug.log", "a", encoding="utf-8") as f:
                f.write(msg + "\n")
        except: pass

case_parser = CaseParser()

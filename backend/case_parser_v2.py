
import pdfplumber
import re
from typing import Dict, Any, List, Optional
try:
    from backend.seo import pii_masker
except ImportError:
    try:
        from seo import pii_masker
    except ImportError:
        # Fallback for direct execution
        import sys
        import os
        sys.path.append(os.path.dirname(os.path.abspath(__file__)))
        sys.path.append(os.path.dirname(os.path.abspath(__file__)))
        from seo import pii_masker as old_pii_masker

try:
    from backend.text_processor import TextCleaner, PIIMasker
except ImportError:
    from text_processor import TextCleaner, PIIMasker

class CaseParser:
    def __init__(self):
        pass

    LEGAL_WRITER_PROMPT = """
    [1. 역할]
    당신은 10년차 변호사가 자기 블로그에 직접 사건 후기를 쓰는 것처럼 글을 씁니다.
    AI가 쓴 글이 아니라, 사람이 자기 경험을 회고하며 쓴 글처럼 보여야 합니다.
    목적: 잠재 의뢰인이 "이 변호사한테 맡기고 싶다"고 느끼게 만드는 것.

    [2. AI 티 벗기기 — 최우선 규칙]
    ★ 아래 표현은 절대 사용 금지 (AI 냄새가 강하게 남):
    "결론적으로", "요약하자면", "시사하는 바가 큽니다", "전문가의 조력이 필수적",
    "따라서", "이처럼", "이에 따라", "무엇보다", "특히 주목할 점은",
    "든든한 조력자", "치밀한 분석", "날카로운 법리적 해석", "판을 뒤집",
    "아찔한 상황", "가슴이 찢어질 듯한", "막막한 심정", "결국", "한편",
    "~할 수 있었습니다", "~게 되었습니다"를 연속으로 사용하지 마.

    ★ 자연스러운 문체 규칙:
    - 한 단락 2~3문장. 호흡 짧게.
    - 문장 길이를 불균일하게. 긴 문장 뒤에 "그랬다." 같은 짧은 문장.
    - "~했습니다"와 "~했다", "~인 거다"를 7:2:1 비율로 섞어.
    - 가끔 구어체: "솔직히", "처음엔 저도", "이런 경우가 은근 많습니다", "쉽게 말해"
    - 법률 용어는 괄호로 쉽게 풀어줘: "소멸시효(돈 받을 수 있는 기한)"
    - 글머리 기호(-, *) 자제. 줄글 위주.

    [3. 글 구조]
    자연스러운 에세이. "1단계", "2단계" 라벨 붙이지 마.
    
    소제목(##)은 짧고 임팩트 있게 (예: "## 사건의 시작", "## 반전", "## 이겼다")

    파트1 - 의뢰인 상황 공감. "비슷한 일을 겪고 계시다면" 느낌.
    파트2 - 불리했던 점, 상대방 주장. 긴장감.
    파트3 - 변호사(나)의 전략/증거. 이 사건의 하이라이트.
    파트4 - 결과 + 담백한 마무리. "비슷한 일로 고민 중이시라면, 상담 한번 받아보시는 것도 방법입니다." 정도.

    [4. 익명화 — ★★★ 절대 규칙: 실명 절대 금지 ★★★]
    판결문에 나오는 모든 사람 이름을 반드시 제거합니다. 예외 없음.
    
    - 원고/의뢰인 이름(예: 김소연, 박지원) → "의뢰인" 또는 "의뢰인 A씨"
    - 피고/상대방 이름(예: 권준상, 이철수) → "상대방" 또는 "남편/아내/상대 B씨"
    - 제3자 이름 → 관계로 변경: "상간자", "피해자", "동업자" 등
    - 판사, 검사, 변호사 이름 → 전부 생략, 절대 언급하지 않기
    - 회사명 → "A사", "B기업" 또는 업종명
    - 구체적 주소 → 시/구까지만 (예: "서울 서초구의 아파트")
    - 전화번호, 주민번호 → 전부 삭제
    - 이름 뒤에 "모씨", "(권 모씨)" 같은 표현도 금지. 그냥 "상대방", "남편" 등으로 써.

    [5. SEO]
    - 제목에 핵심 키워드 포함 (25~45자)
    - 본문 초반에 키워드 1회 등장
    - 분량: 1,500~2,500자

    [6. Output — STRICT JSON]
    {
        "title": "SEO 제목",
        "emotional_title": "감성 부제",
        "emotional_summary": "메타 설명 2줄 (120~155자)",
        "story": "1500~2500자 에세이. ## 소제목. 줄글. 모든 실명 제거 완료.",
        "key_takeaways": ["쟁점: ...", "해결: ...", "결과: ..."],
        "case_number": "사건번호",
        "court": "법원명",
        "ai_tags": "키워드, 쉼표, 구분"
    }
    """

    def log_debug(self, message: str):
        # Prevent console encoding errors (cp949 on Windows)
        try:
            print(message)
        except Exception:
            pass
            
        try:
            with open("backend/console_debug.log", "a", encoding="utf-8") as f:
                f.write(message + "\n")
        except Exception:
            pass

    def extract_text_from_pdf(self, file_path: str) -> str:
        """
        Extract raw text from PDF using pdfplumber for better layout handling.
        """
        import os
        text = ""
        abs_path = os.path.abspath(file_path)
        self.log_debug(f"DEBUG: extract_text_from_pdf called for {abs_path}")
        try:
            text = ""
            with pdfplumber.open(file_path) as pdf:
                self.log_debug(f"DEBUG: PDFPlumber opened. Total pages: {len(pdf.pages)}")
                for i, page in enumerate(pdf.pages):
                    extracted = page.extract_text()
                    page_len = len(extracted) if extracted else 0
                    self.log_debug(f"DEBUG: Page {i+1} text length: {page_len}")
                    if page_len == 0:
                        self.log_debug(f"DEBUG: Page {i+1} text empty")
                    if extracted:
                        text += extracted + "\n"
            
            # Basic cleaning via TextCleaner
            text = TextCleaner.clean(text)
            self.log_debug(f"DEBUG: Final extracted text length: {len(text)}")
            return text
        except Exception as e:
            import traceback
            import sys
            self.log_debug(f"CRITICAL ERROR in extract_text_from_pdf: {e}")
            with open("backend/console_debug.log", "a", encoding="utf-8") as f:
                traceback.print_exc(file=f)
            traceback.print_exc()
            raise

    def parse_structure(self, text: str) -> Dict[str, Any]:
        """
        Parse raw text into structured JSON using OpenAI.
        """
        self.log_debug("DEBUG: parse_structure called")
        # Initialize output structure
        output = {
            "title": "판결문 (제목 미정)",
            "summary": "요약 정보를 생성할 수 없습니다.",
            "full_text": text.strip() if text else "",
            "facts": "사실 관계를 파악할 수 없습니다.",
            "issues": "쟁점을 파악할 수 없습니다.",
            "decision": "판결 결과를 파악할 수 없습니다."
        }

        if not text or len(text.strip()) < 50:
             self.log_debug("DEBUG: Text too short for structure parsing")
             return output
        
        # ... rest of parse_structure (omitted for brevity, or kept same) ...
        # I need to be careful not to delete the rest of the file or method body if I use replace_file_content with range.
        # The user wants me to replace `extract_text_from_pdf` and `parse_from_images`.
        # I will target specific blocks. 

        # I will return the method body for parse_structure as well or just let it be if I don't touch it.
        # Wait, I cannot define log_debug inside the class and use it if I don't put it in the class definition.
        # I should put log_debug in the class.
        
        # To avoid replacing the whole file and making mistakes, I will add `log_debug` method and update `extract_text_from_pdf`.
        # But `parse_from_images` is further down.
        # I should use `multi_replace_file_content` to update both methods and add the helper.

    # ... (I will construct the ReplacementChunks correctly in the tool call) ...

    def parse_structure(self, text: str) -> Dict[str, Any]:
        """
        Parse raw text into structured winning case data.
        Enhancement: Generates a detailed 500-char summary using OpenAI if available, 
        or falls back to extracting larger chunks of text.
        """
        self.log_debug(f"DEBUG: parse_structure called with text length {len(text)}")
        
        # 1. Normalize
        lines = text.split('\n')
        
        # 2. Extract Header Info (Case No, Court)
        case_no = ""
        case_pattern = r"\d{4}[가-힣]+\d+"
        match = re.search(case_pattern, text)
        if match:
            case_no = match.group(0)
            
        court = "서울중앙지방법원" if "서울중앙" in text else "법원"

        # 3. AI-Powered Extraction (Simulated or Real)
        # Try to use OpenAI to get a high-quality summary if possible
        client_story = ""
        ai_tags_summary = ""
        
        facts = ""
        issues = ""
        reasoning = ""
        conclusion = ""
        
        try:
            # We try to import client from search.py or openai directly
            # We try to import search_engine from search.py
            try:
                from backend.search import search_engine
            except ImportError:
                from search import search_engine
            
            openai_client = search_engine.client
            self.log_debug(f"DEBUG: parse_structure openai_client status: {openai_client is not None}")
            
            if openai_client:
                # Use class constant for prompt
                prompt = self.LEGAL_WRITER_PROMPT + f"\n\nText:\n{text[:12000]}" # Increased limit for better context
                
                response = openai_client.chat.completions.create(
                    model="gpt-4o",
                    messages=[
                        {"role": "system", "content": prompt},
                        {"role": "user", "content": f"아래 판결문을 분석하여 익명화된 승소사례 에세이를 작성해주세요:\n\n{text[:12000]}"}
                    ],
                    response_format={"type": "json_object"},
                    temperature=0.7
                )
                
                self.log_debug(f"DEBUG: parse_structure OpenAI raw response: {response}")
                
                content = response.choices[0].message.content
                import json
                data = json.loads(content)
                self.log_debug(f"DEBUG: JSON Parsed keys: {list(data.keys())}")
                
                story = data.get("story", "")
                title = data.get("title", "")
                emotional_title = data.get("emotional_title", "")
                emotional_summary = data.get("emotional_summary", "")
                case_no = data.get("case_number", case_no)
                court = data.get("court", court)
                ai_tags_summary = data.get("ai_tags", "")
                key_takeaways = data.get("key_takeaways", [])
                
                # Assign to flattened structure for compatibility
                facts = story[:200] + "..." if len(story) > 200 else story
                issues = "스토리 내 포함"
                reasoning = "스토리 내 포함"
                conclusion = "승소"
                client_story = story
                
            else:
                self.log_debug("DEBUG: parse_structure skipped because openai_client is None")
                pass # Trigger fallback
                
        except Exception as e:
            error_msg = f"AI Extraction failed: {e}"
            self.log_debug(f"CRITICAL: {error_msg}")
            
            # Fallback Mock Data
            facts = "의뢰인은 억울한 혐의를 받고 있었습니다..."
            issues = "- 증거 불충분\n- 법리 오해"
            reasoning = "법원은 증거가 부족하다고 판단하였습니다."
            conclusion = "무죄"
            client_story = (
                "본 사건은 의뢰인이 억울하게 휘말린 복잡한 사안이었습니다. "
                "쟁점은 주로 사실관계의 입증과 법리적 해석에 있었으며, "
                "변호인의 치밀한 분석 끝에 승소를 이끌어낼 수 있었습니다.\n"
                f"(Error: {str(e)})"
            )
            ai_tags_summary = "형사, 무죄, 증거불충분"
            summary_one_line = "분석 실패"
            emotional_title = ""
            emotional_summary = ""
            key_takeaways = ["쟁점: 분석 실패", "해결: 재시도 필요", "결과: 데이터 없음"]

        story_text = (data.get("story") or client_story) if 'data' in locals() else client_story
        title_text = (data.get("title") or "승소사례") if 'data' in locals() else "승소사례"
        
        if not title_text: title_text = "승소사례"
        if not story_text: story_text = client_story


        structured = {
            "case_number": case_no,
            "court": court,
            "full_text": text,
            "facts": facts, 
            "issues": issues,
            "reasoning": reasoning,
            "conclusion": conclusion,
            "decision": conclusion, # API compatibility
            "client_story": story_text,
            "ai_tags": ai_tags_summary,
            "summary": story_text[:100] + "..." if story_text else "요약 없음",
            "key_takeaways": key_takeaways if 'key_takeaways' in locals() else [],
            "title": title_text,
            "emotional_title": emotional_title if 'emotional_title' in locals() else "",
            "emotional_summary": emotional_summary if 'emotional_summary' in locals() else ""
        }

        
        self.log_debug(f"DEBUG: Returning structured data. Facts len: {len(structured['facts'])}")
        return structured

    def parse_from_images(self, file_path: str) -> Dict[str, Any]:
        """
        Fallback method: Parse structured data from PDF images using GPT-4o Vision.
        Used when text extraction fails (scanned PDFs).
        """
        import base64
        import os
        abs_path = os.path.abspath(file_path)
        self.log_debug(f"DEBUG: parse_from_images triggered for {abs_path}")
        
        # 1. Convert PDF to Images (Max 5 pages)
        images_b64 = []
        try:
            self.log_debug("DEBUG: Attempting import fitz (PyMuPDF)")
            try:
                import fitz  # PyMuPDF
                self.log_debug(f"DEBUG: fitz imported successfully. File: {fitz.__file__}")
            except ImportError:
                self.log_debug("DEBUG: Import fitz failed. Trying 'import pymupdf as fitz'")
                import pymupdf as fitz
                self.log_debug(f"DEBUG: pymupdf as fitz imported successfully. File: {fitz.__file__}")

            doc = fitz.open(file_path)
            self.log_debug(f"DEBUG: PyMuPDF opened doc. Page count: {len(doc)}")
            
            for i in range(min(5, len(doc))):
                page = doc.load_page(i)
                pix = page.get_pixmap()
                img_data = pix.tobytes("png")
                data_len = len(img_data)
                self.log_debug(f"DEBUG: Page {i+1} rendered. Data size: {data_len} bytes")
                
                b64 = base64.b64encode(img_data).decode("utf-8")
                images_b64.append(b64)
        except ImportError as e:
            import sys
            import traceback
            error_details = f"ImportError: {e}\nSys Exec: {sys.executable}\nSys Path: {sys.path}"
            self.log_debug(error_details)
            with open("backend/console_debug.log", "a", encoding="utf-8") as f:
                traceback.print_exc(file=f)
            return self._get_fallback_mock_data(f"PyMuPDF 모듈 로드 실패. (서버 로그 확인 필요) {e}")
        except Exception as e:
            import traceback
            self.log_debug(f"Image conversion failed: {e}")
            with open("backend/console_debug.log", "a", encoding="utf-8") as f:
                traceback.print_exc(file=f)
            return self._get_fallback_mock_data(f"이미지 변환 오류: {type(e).__name__}: {e}")

        # 2. Call GPT-4o Vision
        try:
            try:
                from backend.search import search_engine
            except ImportError:
                from search import search_engine
            
            openai_client = search_engine.client
            
            if not openai_client:
                self.log_debug("DEBUG: OpenAI client not initialized")
                return self._get_fallback_mock_data("OpenAI 클라이언트 초기화 실패")

            self.log_debug(f"DEBUG: Calling GPT-4o Vision with {len(images_b64)} images")
            


            # Prepare image content blocks
            content_blocks = [
                {"type": "text", "text": self.LEGAL_WRITER_PROMPT + "\n\nAnalyze these pages of a Korean legal judgment as images."}
            ]
            for b64 in images_b64:
                content_blocks.append({
                    "type": "image_url",
                    "image_url": {"url": f"data:image/png;base64,{b64}"}
                })
            
            # (Instructions are already in content_blocks[0] via LEGAL_WRITER_PROMPT)

            response = openai_client.chat.completions.create(
                model="gpt-4o",
                messages=[{"role": "user", "content": content_blocks}],
                response_format={"type": "json_object"},
                temperature=0.0
            )
            
            self.log_debug(f"DEBUG: OpenAI Response: {response}")
            content = response.choices[0].message.content
            
            if not content:
                 refusal_msg = "No content returned"
                 if hasattr(response.choices[0].message, 'refusal'):
                     refusal_msg = f"Refusal: {response.choices[0].message.refusal}"
                 
                 self.log_debug(f"DEBUG: {refusal_msg}")
                 return self._get_fallback_mock_data(f"AI 분석 거절: {refusal_msg}")
            
            import json
            data = json.loads(content)
            
            return {
                "case_number": data.get("case_number", ""),
                "court": data.get("court", ""),
                "full_text": "(Scanned PDF - Text extracted via AI Vision)",
                "facts": data.get("story", "")[:200] + "...", 
                "issues": "스토리 내 포함",
                "reasoning": "스토리 내 포함",
                "conclusion": "승소",
                "client_story": data.get("story", ""),
                "ai_tags": data.get("ai_tags", ""),
                "summary": data.get("story", "")[:100] + "...",
                "emotional_title": data.get("emotional_title", ""),
                "emotional_summary": data.get("emotional_summary", ""),
                "title": data.get("title", "승소사례")
            }

        except Exception as e:
            import traceback
            self.log_debug(f"CRITICAL: Vision Parsing failed: {e}")
            with open("backend/console_debug.log", "a", encoding="utf-8") as f:
                traceback.print_exc(file=f)
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
        Additional anonymization specific to legal cases.
        Strictly masks Real Names (A, B, C), Locations, and Case Numbers.
        """
        # Use new PIIMasker
        return PIIMasker.mask(text)

case_parser = CaseParser()

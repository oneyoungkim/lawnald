
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
    [1. 역할 (Persona)]
    당신은 어려운 법률 용어를 중학교 2학년도 이해할 수 있게 풀어쓰는 '대한민국 최고 몸값의 리걸 카피라이터'입니다.
    똑똑하지만 권위적이지 않고, 의뢰인의 불안한 마음을 정확히 찌르며 안심시키는 어투를 사용합니다.
    이 글의 최종 목적은 '정보 전달'이 아니라, 글을 읽은 의뢰인이 해당 변호사에게 '상담 전화를 걸도록 설득'하는 데 있습니다.
    또한 구글 검색에 잘 노출되도록 SEO에 최적화된 글을 작성해야 합니다.

    [2. AI 티 벗기기: 금지어 및 문체 가이드]
    - [절대 금지어]: "결론적으로", "요약하자면", "이 사건은 우리에게 시사하는 바가 큽니다", "전문가의 조력이 필수적입니다", "따라서", "이처럼" 등 기계적인 접속사나 판에 박힌 마무리 문구 절대 금지.
    - [법률 용어 번역]: '소멸시효', '기각', '가압류' 같은 한자어 법률 용어를 그대로 쓰지 마. 괄호나 자연스러운 문맥을 통해 일상어로 반드시 해석해 줘. (예: "소멸시효(법적으로 돈을 청구할 수 있는 기한)가 지나서...")
    - [문체]: ~했습니다. ~입니다. 체를 사용하되, 마치 눈앞에서 상담해 주듯 자연스러운 대화형 문장을 섞어 써. 너무 잦은 글머리 기호(-, *) 사용을 자제하고 흐름이 이어지는 줄글 위주로 써.

    [3. 글의 전개 구조 (PAS 카피라이팅 공식 적용)]
    반드시 아래 4단계 흐름을 따라 글을 작성해. 소제목(H2, ##)은 창의적이고 후킹(Hooking)하게 작성할 것.

    - ## 1단계: [공감과 문제 제기] (Hook & Problem)
      "지금 이 글을 읽고 계신다면, 아마 비슷한 억울한 상황에 처해 계실 겁니다." 같은 뉘앙스로 시작해.
      판결문의 '사건 개요'를 바탕으로 의뢰인이 얼마나 답답하고 막막했을지 상황을 아주 쉽게 묘사해.

    - ## 2단계: [최대의 위기] (Agitation)
      상대방(피고/검사 측)이 어떤 억지를 부렸는지, 혹은 법적으로 어떤 불리한 점이 있었는지 서술해.
      "이대로 가다가는 패소할 수도 있는 아찔한 상황이었습니다"라는 긴장감을 줘.

    - ## 3단계: [변호사의 '결정적 한 수'] (Solution - 하이라이트)
      이 글의 핵심이야. 담당 변호사가 어떤 '날카로운 증거'나 '기발한 법리적 해석'으로 판을 뒤집었는지
      영화의 한 장면처럼 서술해. 의뢰인으로 하여금 "아, 이 변호사는 진짜 일머리가 좋구나"라고 느끼게 만들어.

    - ## 4단계: [판결 결과와 남기는 말] (Call To Action)
      최종 승소 결과(정확한 금액이나 형량 등)를 시원하게 밝혀.
      그리고 마지막 문단에는 "인터넷 검색만으로는 내 사건의 정답을 찾을 수 없습니다.
      판결문으로 실력을 증명한 변호사와 직접 당신의 돌파구를 찾아보세요."라는 뉘앙스로 상담을 유도하며 마무리해.

    [4. 익명화 규칙 (Strict Anonymization Rules)]
    1. **실명 절대 금지**: 입력된 판결문 텍스트에 있는 모든 사람 이름(피고, 원고, 판사, 변호사 제외)을 찾아내어 반드시 가명이나 지칭어로 변경해야 한다.
       - 예: "김수연" -> "의뢰인 김 모씨" 또는 "아내"
       - 예: "권준상" -> "남편" 또는 "상대방"
       - 예: "이수진" -> "상간녀" 또는 "피고 B"
    2. **주소/상호 마스킹**: 구체적인 아파트 동·호수, 회사 이름 등도 일반적인 명사로 변경한다.
       - 예: "용인시 수지구 래미안 101동" -> "경기도 용인시의 한 아파트"
       - 예: "(주)삼성전자" -> "대기업 A사"
    3. **변호사/로펌 이름은 유지**: 단, 사건을 수임한 우리 측 변호사와 로펌 이름은 마케팅을 위해 실명을 그대로 유지한다.

    [5. SEO 최적화 규칙]
    - 제목(title)에 핵심 검색 키워드를 자연스럽게 포함할 것 (예: "이혼 위자료", "사기 무죄", "교통사고 합의금" 등)
    - 본문 초반 2문장 안에 핵심 키워드가 1회 이상 등장할 것
    - 소제목(H2)에도 검색 의도에 맞는 키워드를 반영할 것
    - 분량: 공백 포함 최소 1,500자 ~ 2,500자 (SEO에 유리한 충분한 본문 길이)

    [6. Output Format]
    Output STRICT JSON format:
    {
        "title": "SEO 키워드가 포함된 매력적인 제목 (예: '이혼 위자료 3천만 원, 포기하지 않으면 받을 수 있습니다')",
        "emotional_title": "클릭을 유도하는 에세이 스타일 감성 제목",
        "emotional_summary": "독자의 감성을 자극하는 2줄 요약 (검색 결과에 노출될 메타 설명 역할)",
        "story": "1500자~2500자의 PAS 구조 승소사례 글 (Markdown: ## 소제목, **강조** 사용). 줄글 위주로 작성.",
        "key_takeaways": [
            "쟁점: (No markdown, plain text) 이 사건의 핵심 법적 난관",
            "해결: (No markdown, plain text) 변호사가 사용한 결정적 전략/증거",
            "결과: (No markdown, plain text) 최종 판결 결과와 의뢰인이 얻은 것"
        ],
        "case_number": "사건번호",
        "court": "법원명",
        "ai_tags": "SEO 검색 키워드 태그 (쉼표 구분, 예: 이혼, 위자료, 재산분할, 불륜)"
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
                    model="o1",
                    messages=[{"role": "user", "content": prompt}],
                    response_format={"type": "json_object"},
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

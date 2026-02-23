from fastapi import APIRouter, HTTPException, Body
from pydantic import BaseModel
from bs4 import BeautifulSoup
import requests
import re
import os
import openai
from datetime import datetime
from dotenv import load_dotenv
from pathlib import Path

# .env 파일 경로를 명시적으로 지정 (backend/.env 또는 프로젝트 루트 .env)
_env_dir = Path(__file__).resolve().parent.parent  # routers/ -> backend/ -> project root
for _env_path in [_env_dir / ".env", _env_dir.parent / ".env", Path.cwd() / ".env"]:
    if _env_path.exists():
        load_dotenv(_env_path)
        break

router = APIRouter()

class BlogImportRequest(BaseModel):
    url: str

class BlogImportResponse(BaseModel):
    title: str
    content: str # Markdown format
    category: str
    keyword: str
    cover_image_url: str
    original_url: str

def parse_naver_blog_url(url: str):
    """
    Parse Naver blog URL to extract blog_id and log_no.
    Supports formats:
    - https://blog.naver.com/blogid/123456789
    - https://blog.naver.com/PostView.naver?blogId=xxx&logNo=yyy
    - https://m.blog.naver.com/blogid/123456789
    """
    import urllib.parse
    
    parsed = urllib.parse.urlparse(url)
    
    # Format: /blogid/logno
    path_parts = [p for p in parsed.path.split("/") if p]
    
    if "PostView" in parsed.path:
        # Query parameter format
        params = urllib.parse.parse_qs(parsed.query)
        blog_id = params.get("blogId", [None])[0]
        log_no = params.get("logNo", [None])[0]
        return blog_id, log_no
    
    if len(path_parts) >= 2:
        blog_id = path_parts[0]
        log_no = path_parts[1]
        # Validate log_no is numeric
        if log_no.isdigit():
            return blog_id, log_no
    
    return None, None


def get_blog_text(blog_id: str, log_no: str):
    """
    Crawl blog content from Naver blog post.
    Uses the postView iframe URL for reliable content extraction.
    """
    # Naver blog uses iframe, so we need to access the actual content URL
    content_url = f"https://blog.naver.com/PostView.naver?blogId={blog_id}&logNo={log_no}&redirect=Dlog&widgetTypeCall=true&directAccess=false"
    
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Referer": f"https://blog.naver.com/{blog_id}/{log_no}"
    }
    
    response = requests.get(content_url, headers=headers, timeout=15)
    response.raise_for_status()
    
    soup = BeautifulSoup(response.text, "html.parser")
    
    # Extract title
    title_tag = soup.select_one(".se-title-text, .pcol1, .se_textarea, .htitle span, .__se_code_view_title")
    title = title_tag.get_text(strip=True) if title_tag else "제목 없음"
    
    # Extract main content
    # Try multiple selectors for different blog editor versions
    content_selectors = [
        ".se-main-container",  # Smart Editor 3
        ".se_component_wrap",  # Smart Editor 2
        "#postViewArea",       # Old editor
        ".post-view",          # Alternative
        "#post-view",          # Alternative 2
    ]
    
    content_area = None
    for selector in content_selectors:
        content_area = soup.select_one(selector)
        if content_area:
            break
    
    if not content_area:
        # Fallback: grab all text from body
        content_area = soup.find("body")
    
    if content_area:
        # Remove script/style tags
        for tag in content_area.select("script, style, .se-oglink-container, .se-sticker-container"):
            tag.decompose()
        
        text = content_area.get_text(separator="\n", strip=True)
        # Clean up excessive newlines
        text = re.sub(r'\n{3,}', '\n\n', text)
    else:
        text = ""
    
    return title, text

def rewrite_with_llm(text: str):
    """
    Rewrites text into a storytelling magazine style using GPT-4o and extracts metadata.
    SEO-optimized title, meta description, and slug are generated.
    Returns a dict with title, content, category, keyword, meta_description, slug.
    """
    client = openai.OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    
    system_prompt = (
        "너는 법률 분야 전문 매거진 에디터이자 SEO 전문가야. 입력된 블로그 글을 분석하여 다음 작업을 수행해:\n\n"
        "1. **윤문**: 독자가 몰입할 수 있는 '에세이' 형식으로 재구성해. '변호사의 철학'과 '해결 과정'이 돋보이게 문장을 부드럽게 다듬고, Markdown 형식으로 작성해.\n"
        "   - 본문 중간에 삽화가 가장 효과적인 위치에 `[IMAGE]` 태그를 **정확히 1개만** 삽입해. 이 위치에 AI가 관련 이미지를 자동 삽입할 거야.\n"
        "   - [IMAGE] 태그는 반드시 빈 줄 사이에 단독으로 넣어.\n\n"
        "2. **SEO 최적화 제목**: 아래 SEO 규칙을 지켜 제목을 작성해:\n"
        "   - 핵심 키워드를 제목 앞부분에 배치 (예: '이혼 재산분할, 숨겨진 재산도 찾을 수 있습니다')\n"
        "   - 25~45자 사이 길이 (네이버/구글 검색 결과 노출 최적 길이)\n"
        "   - 의뢰인이 실제로 검색할 만한 자연어 패턴 사용\n"
        "   - 결과나 해결을 암시하는 표현 포함 (예: '성공 사례', '해결 방법', '승소 전략')\n"
        "   - 구체적 숫자나 상황이 있으면 활용 (예: '3억 손해배상 인용', '집행유예 성공')\n\n"
        "3. **카테고리 분류**: 다음 중 하나 선택: [형사, 이혼/가사, 민사, 부동산/건설, 기업법무, 행정, 노동, 의료, 기타]\n\n"
        "4. **핵심 키워드**: 실제 검색량이 높을 법한 2~4글자 키워드 1개 (예: '이혼소송', '음주운전', '손해배상')\n\n"
        "5. **메타 설명**: 120~155자의 SEO meta description. 핵심 키워드를 포함하고, 클릭을 유도하는 문장으로 작성.\n\n"
        "6. **URL 슬러그**: 키워드 기반 영문 slug (예: 'divorce-property-division-hidden-assets')\n\n"
        "**반드시 JSON 형식으로 출력해.**\n"
        "예시:\n"
        "{\n"
        '  "title": "이혼 재산분할, 배우자가 숨긴 재산도 찾아낸 실제 사례",\n'
        '  "content": "## 들어가며\\n\\n이혼 과정에서 가장...\\n\\n[IMAGE]\\n\\n## 사건의 전개\\n...",\n'
        '  "category": "이혼/가사",\n'
        '  "keyword": "이혼재산분할",\n'
        '  "meta_description": "배우자가 숨긴 재산, 정말 찾을 수 있을까? 실제 이혼 재산분할 소송에서 은닉 재산을 성공적으로 추적한 사례와 핵심 법률 전략을 소개합니다.",\n'
        '  "slug": "divorce-property-division-hidden-assets"\n'
        "}"
    )
    
    try:
        response = client.chat.completions.create(
            model="o1",
            messages=[
                {"role": "developer", "content": system_prompt},
                {"role": "user", "content": f"다음 글을 분석하고 SEO 최적화하여 변환해줘:\n\n{text[:15000]}"}
            ],
            response_format={ "type": "json_object" }
        )
        import json
        return json.loads(response.choices[0].message.content)
    except Exception as e:
        print(f"LLM Error: {e}")
        # Fallback
        return {
            "title": "제목 생성 실패",
            "content": text,
            "category": "기타",
            "keyword": "일반",
            "meta_description": "",
            "slug": ""
        }

def generate_cover_image(content_summary: str):
    """
    Generates a high-quality cover image using DALL-E 3 based on content.
    Downloads the image and saves it locally to static/images/blog/.
    Returns a local URL path.
    
    ⚠ Style is LOCKED to navy/blue flat illustration for brand consistency.
    """
    import uuid
    client = openai.OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    
    # ── 1. Extract theme keyword (cheap GPT-4o-mini call) ──
    prompt_response = client.chat.completions.create(
        model="o1",
        messages=[
            {"role": "developer", "content": "You extract the ONE core visual theme from legal text. Output a short English phrase only (5-15 words). Example: 'person signing a contract at a wooden desk'"},
            {"role": "user", "content": f"Extract the core visual theme:\n\n{content_summary[:600]}"}
        ]
    )
    
    theme = prompt_response.choices[0].message.content or "legal consultation"
    
    # ── 2. LOCKED style guideline (never changes) ──
    STYLE_LOCK = (
        "Clean flat vector illustration style. "
        "Color palette: navy blue (#1B2A4A), soft blue (#4A7FB5), light cream (#F5F0E8), muted gold accents (#C5A86C). "
        "Simple geometric shapes with soft rounded edges. "
        "People should be depicted as minimal, stylized silhouettes — NOT photorealistic. No detailed facial features. "
        "Absolutely NO: violence, blood, weapons, crime scenes, scary imagery, photorealism, text, logos, watermarks. "
        "Mood: calm, professional, trustworthy, hopeful. "
        "Think: editorial illustration for The New Yorker or Harvard Business Review."
    )
    
    final_prompt = f"{STYLE_LOCK} Scene: {theme}"
    
    # ── 3. Generate Image ──
    try:
        image_response = client.images.generate(
            model="dall-e-3",
            prompt=final_prompt,
            size="1792x1024",
            quality="standard",
            n=1,
        )
        dalle_url = image_response.data[0].url
        
        # ── 4. Download and save to Supabase Storage (persistent) ──
        img_data = requests.get(dalle_url, timeout=30).content
        
        filename = f"blog_{uuid.uuid4().hex[:12]}.png"
        
        # Supabase Storage에 업로드 시도
        try:
            import sys
            parent_dir = str(Path(__file__).resolve().parent.parent)
            if parent_dir not in sys.path:
                sys.path.insert(0, parent_dir)
            from storage_utils import upload_and_get_url  # type: ignore
            public_url = upload_and_get_url("photos", f"blog/{filename}", img_data, "image/png")
            if public_url:
                print(f"[ImageGen] ✅ Supabase Storage: {filename} ({len(img_data) // 1024}KB) | Theme: {theme}")
                return public_url
        except Exception as se:
            print(f"[ImageGen] ⚠️ Supabase 업로드 실패: {se}")
        
        # 로컬 폴백
        blog_img_dir = Path(__file__).resolve().parent.parent / "static" / "images" / "blog"
        blog_img_dir.mkdir(parents=True, exist_ok=True)
        
        file_path = blog_img_dir / filename
        with open(file_path, "wb") as f:
            f.write(img_data)
        
        print(f"[ImageGen] ✅ Local saved: {file_path} ({len(img_data) // 1024}KB) | Theme: {theme}")
        return f"http://localhost:8000/static/images/blog/{filename}"
        
    except Exception as e:
        print(f"[ImageGen] ❌ Failed: {e}")
        return "/images/pattern_1.jpg"

@router.post("/api/blog/import")
def import_naver_blog(request: BlogImportRequest):
    import traceback as tb
    try:
        # 1. Parse URL
        blog_id, log_no = parse_naver_blog_url(request.url)
        if not blog_id or not log_no:
            raise HTTPException(status_code=400, detail="잘못된 네이버 블로그 URL 형식입니다. 개별 포스트 URL을 입력해주세요.")
            
        # 2. Crawl Content
        print(f"[BlogImport] Crawling: blog_id={blog_id}, log_no={log_no}")
        try:
            original_title, original_text = get_blog_text(blog_id, log_no)
        except requests.exceptions.HTTPError as e:
            if e.response is not None and e.response.status_code == 404:
                raise HTTPException(status_code=400, detail="해당 블로그 글을 찾을 수 없습니다. URL을 다시 확인해주세요.")
            raise HTTPException(status_code=500, detail=f"블로그 크롤링 실패: {str(e)}")
        except requests.exceptions.Timeout:
            raise HTTPException(status_code=504, detail="블로그 서버 응답 시간이 초과되었습니다. 잠시 후 다시 시도해주세요.")
            
        if not original_text or len(original_text.strip()) < 50:
            raise HTTPException(status_code=400, detail="블로그 글 내용을 추출할 수 없습니다. 비공개 글이거나 내용이 너무 짧습니다.")

        print(f"[BlogImport] Crawled {len(original_text)} chars. Calling LLM...")

        # 3. Rewrite Content & Extract Metadata
        llm_result = rewrite_with_llm(original_text)
        print(f"[BlogImport] LLM done. Generating cover image...")
        
        # 4. Generate Image
        content_for_image = llm_result.get("content", "")[:1000]
        cover_image = generate_cover_image(content_for_image)
        print(f"[BlogImport] Image done. Returning response.")
        
        return {
            "title": llm_result.get("title", original_title),
            "content": llm_result.get("content", original_text),
            "category": llm_result.get("category", "기타"),
            "keyword": llm_result.get("keyword", ""),
            "cover_image_url": cover_image,
            "original_url": request.url
        }
    except HTTPException:
        raise  # Re-raise HTTP exceptions as-is
    except Exception as e:
        print(f"[BlogImport] ❌ UNHANDLED ERROR: {e}")
        tb.print_exc()
        raise HTTPException(status_code=500, detail=f"블로그 불러오기 중 오류: {str(e)}")

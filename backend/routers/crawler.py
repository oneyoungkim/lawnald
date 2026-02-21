from fastapi import APIRouter, HTTPException, Body
from pydantic import BaseModel
from bs4 import BeautifulSoup
import requests
import re
import os
import openai
from datetime import datetime

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

# ... (parse_naver_blog_url and get_blog_text remain the same - no changes needed, so I will skip them in this replacement if possible, but replace_file_content needs contiguous block. I will replace from rewrite_with_llm onwards)

def rewrite_with_llm(text: str):
    """
    Rewrites text into a storytelling magazine style using GPT-4o and extracts metadata.
    Returns a dict with title, content, category, keyword.
    """
    client = openai.OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    
    system_prompt = (
        "너는 전문 매거진 에디터야. 입력된 블로그 글을 분석해서 다음 작업을 수행해:\n"
        "1. **윤문**: 독자가 몰입할 수 있는 '에세이' 형식으로 재구성해. '변호사의 철학'과 '해결 과정'이 돋보이게 문장을 부드럽게 다듬고, Markdown 형식으로 작성해.\n"
        "2. **제목 추출**: 클릭을 유도하는 감성적이고 스토리가 담긴 제목을 1개 작성해.\n"
        "3. **카테고리 분류**: 다음 중 하나를 선택해: [형사, 이혼/가사, 민사, 부동산/건설, 기업법무, 행정, 기타].\n"
        "4. **핵심 키워드**: SEO에 유리한 메인 키워드 1개를 추출해.\n\n"
        "**반드시 JSON 형식으로 출력해.**\n"
        "예시:\n"
        "{\n"
        '  "title": "억울한 누명, 그 끝에서 만난 희망",\n'
        '  "content": "## 사건의 시작\\n어느 날...",\n'
        '  "category": "형사",\n'
        '  "keyword": "음주운전무죄"\n'
        "}"
    )
    
    try:
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"다음 글을 분석하고 변환해줘:\n\n{text[:15000]}"}
            ],
            temperature=0.7,
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
            "keyword": "일반"
        }

def generate_cover_image(content_summary: str):
    """
    Generates a high-quality cover image using DALL-E 3 based on content.
    """
    client = openai.OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    
    # 1. Generate Prompt
    prompt_response = client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": "You are an expert art director. extract the core theme from the text and create a DALL-E 3 prompt."},
            {"role": "user", "content": f"""
            Based on the following text, create a DALL-E 3 image prompt.
            
            [Style Guide]
            - Abstract, Minimalist, Professional, Corporate Memphis or Oil Painting style.
            - Color Palette: Deep Forest Green (#154030) and Gold (#C5A065) accents.
            - Mood: Calm, Trustworthy, Legal metaphors (Scales, Documents, Handshake, Light).
            - NO TEXT in image.
            
            Text: {content_summary[:1000]}
            
            Output ONLY the English prompt.
            """}
        ]
    )
    
    image_prompt = prompt_response.choices[0].message.content or "A legal professional working in an office"
    
    # 2. Generate Image
    try:
        image_response = client.images.generate(
            model="dall-e-3",
            prompt=image_prompt,
            size="1024x1024",
            quality="standard",
            n=1,
        )
        return image_response.data[0].url
    except Exception as e:
        print(f"Image generation failed: {e}")
        return "/images/pattern_1.jpg" # Fallback

@router.post("/api/blog/import", response_model=BlogImportResponse)
async def import_naver_blog(request: BlogImportRequest):
    # 1. Parse URL
    blog_id, log_no = parse_naver_blog_url(request.url)
    if not blog_id or not log_no:
        raise HTTPException(status_code=400, detail="Invalid Naver Blog URL format.")
        
    # 2. Crawl Content
    try:
        original_title, original_text = get_blog_text(blog_id, log_no)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Crawling failed: {str(e)}")
        
    if not original_text:
        raise HTTPException(status_code=400, detail="No content found in blog post.")

    # 3. Rewrite Content & Extract Metadata
    llm_result = rewrite_with_llm(original_text)
    
    # 4. Generate Image
    content_for_image = llm_result.get("content", "")[:1000]
    cover_image = generate_cover_image(content_for_image)
    
    return {
        "title": llm_result.get("title", original_title),
        "content": llm_result.get("content", original_text),
        "category": llm_result.get("category", "기타"),
        "keyword": llm_result.get("keyword", ""),
        "cover_image_url": cover_image,
        "original_url": request.url
    }

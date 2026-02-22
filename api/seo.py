import re
import random
import datetime
from typing import List, Dict, Optional, Any

# --- PII MASKING ---

class PIIMasker:
    PATTERNS = {
        "rrn": r"\d{6}[-]\d{7}",  # Resident Registration Number
        "phone": r"01[016789]-?\d{3,4}-?\d{4}",
        "email": r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}",
        "bank_account": r"\d{3,6}-?\d{2,6}-?\d{3,6}", # Generic bank account pattern
        "driver_license": r"\d{2}-\d{2}-\d{6}-\d{2}", # Driving license
        "passport": r"[a-zA-Z]\d{8}", # Passport
        "ipv4": r"\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}",
        # Specific Korean patterns
        "address": r"(([가-힣]+(시|도)|[서울]|[인천]|[대구]|[광주]|[대전]|[울산]|[부산])( |)[가-힣]+(시|군|구)( |)([가-힣]+(읍|면|동)|(?P<roadName>[가-힣]+(로|길))))",
        "case_number": r"\d{4}[가-힣]+\d+" # Generic case number like 2023가합12345
    }

    @staticmethod
    def mask(text: str) -> str:
        if not text:
            return ""
        
        masked_text = text
        
        # Mask RRN
        masked_text = re.sub(PIIMasker.PATTERNS["rrn"], "******-*******", masked_text)
        
        # Mask Phone (keep first 3 digits)
        def mask_phone(match):
            full = match.group(0)
            parts = full.split('-')
            if len(parts) == 3:
                return f"{parts[0]}-****-{parts[2]}"
            return full[:3] + "****" + full[-4:]
        masked_text = re.sub(PIIMasker.PATTERNS["phone"], mask_phone, masked_text)
        
        # Mask Email
        masked_text = re.sub(PIIMasker.PATTERNS["email"], "[EMAIL_REDACTED]", masked_text)
        
        # Mask Bank Account
        masked_text = re.sub(PIIMasker.PATTERNS["bank_account"], "[ACCOUNT_REDACTED]", masked_text)

        # Mask Case Number (Preserve year, mask rest)
        def mask_case_number(match):
            full = match.group(0)
            return full[:4] + "**" + "*" * (len(full) - 6)
        masked_text = re.sub(PIIMasker.PATTERNS["case_number"], mask_case_number, masked_text)

        return masked_text

# --- SEO GENERATION ---

class SEOGenerator:
    @staticmethod
    def generate_slug(title: str) -> str:
        # Simple slugify: replace spaces with hyphens, remove special chars
        slug = re.sub(r'[^a-zA-Z0-9가-힣\s-]', '', title).strip().replace(' ', '-')
        # Add timestamp to ensure uniqueness
        timestamp = datetime.datetime.now().strftime("%Y%m%d")
        return f"{slug}-{timestamp}"

    @staticmethod
    def generate_seo_title(title: str, lawyer_name: str, type_str: str) -> str:
        # e.g., "이혼 소송 절차 완벽 가이드 - 김철수 변호사 승소사례 | 로날드"
        type_kr = "승소사례" if type_str == "case" else "법률칼럼" if type_str == "column" else "법률영상"
        base_title = title[:30] # Truncate if too long
        return f"{base_title} - {lawyer_name} {type_kr} | 로날드"

    @staticmethod
    def generate_natural_title(case_type: str, key_issues: str, result: str) -> str:
        """
        Generate a natural language title for the blog post.
        Format: [Case Type] [Issues] - [Result]
        e.g. "음주운전 3진 아웃 집행유예 방어 성공"
        """
        if not case_type: case_type = "형사사건"
        
        # Extract keywords from issues/result if they are long sentences
        # Simple heuristic: Take first 2-3 words or specific known outcomes
        
        # Result simplification
        result_simple = "승소"
        if "무죄" in result: result_simple = "무죄 판결"
        elif "집행유예" in result: result_simple = "집행유예 선처"
        elif "기소유예" in result: result_simple = "기소유예"
        elif "벌금" in result: result_simple = "벌금형 방어"
        elif "승소" in result: result_simple = "승소"
        elif "기각" in result: result_simple = "영장/청구 기각"
        
        return f"{case_type} {key_issues[:15]}... - {result_simple}"


    @staticmethod
    def generate_meta_description(content: str, summary: Optional[str] = None) -> str:
        if summary and len(summary) > 10:
            return summary[:150] + "..." if len(summary) > 150 else summary
        
        # Strip markdown/html simplisticly
        clean_text = re.sub(r'<[^>]+>', '', content).replace('\n', ' ')
        return clean_text[:150] + "..."

    @staticmethod
    def generate_faq(content: str, title: str) -> List[Dict[str, str]]:
        # Mock FAQ generation based on title/keywords
        # Real implementation would use LLM
        return [
            {
                "question": f"'{title}' 관련하여 변호사의 도움이 필요한가요?",
                "answer": "네, 전문적인 법률 조력이 필수적입니다. 로날드에서 관련 승소 사례를 보유한 변호사를 찾아보세요."
            },
            {
                "question": "상담 비용은 어떻게 되나요?",
                "answer": "변호사마다 상이하며, 로날드를 통해 채팅 상담을 요청하시거나 방문 상담을 예약하실 수 있습니다."
            },
             {
                "question": "이 사건의 핵심 쟁점은 무엇인가요?",
                "answer": "본문에서 다루고 있는 바와 같이, 증거 수집과 법리적 해석이 가장 중요한 쟁점입니다."
            }
        ]

    @staticmethod
    def get_internal_links(all_articles: List[Dict[str, Any]], current_id: str, count: int = 3) -> List[Dict[str, Any]]:
        # Randomly select 'count' other articles excluding self
        others = [a for a in all_articles if a.get("id") != current_id]
        if not others:
            return []
        return random.sample(others, min(len(others), count))

    @staticmethod
    def generate_schema_org(article: Dict[str, Any], lawyer: Dict[str, Any]) -> str:
        """
        Generate JSON-LD for Schema.org Article and ValidatedLegalService.
        """
        import json
        
        schema = {
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            "headline": article.get("seo_title") or article.get("title") or "",
            "image": [lawyer.get("imageUrl") or "https://lawnald.com/static/logo.png"],
            "datePublished": article.get("date"),
            "dateModified": article.get("date"), # Usually updated date
            "author": [{
                "@type": "Person",
                "name": lawyer.get("name"),
                "jobTitle": "Attorney",
                "url": f"https://lawnald.com/lawyer/{lawyer.get('id')}"
            }],
            "publisher": {
                "@type": "Organization",
                "name": "Lawnald",
                "logo": {
                    "@type": "ImageObject",
                    "url": "https://lawnald.com/static/logo.png"
                }
            },
            "description": article.get("seo_description"),
            "mainEntityOfPage": {
                "@type": "WebPage",
                "@id": f"https://lawnald.com/lawyer/{lawyer.get('id')}/blog/{article.get('slug')}"
            }
        }
        return json.dumps(schema, ensure_ascii=False)

    @staticmethod
    def extract_keywords(content: str, max_keywords: int = 5) -> List[str]:
        """
        Simple keyword extraction (Mock for prototype).
        In real usage, use TF-IDF or Konlpy.
        """
        # Naive: Split by space, filter small words, count freq
        words = re.sub(r'[^\w\s]', '', content).split()
        short_stop_words = ["있다", "한다", "그리고", "하지만", "경우", "대한", "위해", "하는", "입니다", "있습니다"]
        
        freq = {}
        for w in words:
            if len(w) < 2 or w in short_stop_words: continue
            freq[w] = freq.get(w, 0) + 1
            
        sorted_words = sorted(freq.items(), key=lambda x: x[1], reverse=True)
        return [w[0] for w in sorted_words[:max_keywords]]

    @staticmethod
    def generate_open_graph_tags(article: Dict[str, Any], lawyer: Dict[str, Any]) -> Dict[str, Optional[str]]:
        """
        Generate Open Graph Meta Tags.
        """
        return {
            "og:title": article.get("seo_title") or article.get("title"),
            "og:description": article.get("seo_description") or article.get("summary"),
            "og:type": "article",
            "og:url": f"https://lawnald.com/lawyer/{lawyer.get('id')}/blog/{article.get('slug')}",
            "og:image": lawyer.get("cutoutImageUrl") or lawyer.get("imageUrl"),
            "og:site_name": "Lawnald - 로날드",
            "article:published_time": article.get("date"),
            "article:author": lawyer.get("name"),
            "twitter:card": "summary_large_image",
            "twitter:title": article.get("seo_title") or article.get("title"),
            "twitter:description": article.get("seo_description") or article.get("summary"),
        }

seo_generator = SEOGenerator()
pii_masker = PIIMasker()

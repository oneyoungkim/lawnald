import re
from typing import List, Dict, Any

class SEOHelper:
    def __init__(self):
        pass

    def calculate_reading_time(self, content: str) -> int:
        """Estimate reading time in minutes (approx 500 chars per min for Korean)."""
        return max(1, len(content) // 500)

    def analyze_keyword_density(self, content: str, keyword: str) -> Dict[str, Any]:
        """Analyze keyword usage in content."""
        if not content or not keyword:
            return {"count": 0, "density": 0.0, "status": "missing"}
        
        # Normalize
        content_lower = content.lower()
        keyword_lower = keyword.lower()
        
        count = content_lower.count(keyword_lower)
        total_chars = len(content_lower)
        
        # Simple density (occurrences / total length * 1000 for score-like metric)
        # Ideally, we look at word count, but character count is easier for Korean
        density = (count * len(keyword) / total_chars) * 100 if total_chars > 0 else 0
        
        status = "good"
        if density < 0.5:
            status = "low"
        elif density > 3.0:
            status = "high"
            
        return {
            "count": count,
            "density": round(density, 2),
            "status": status
        }

    def check_heading_structure(self, content: str) -> List[Dict[str, Any]]:
        """Check for proper H2/H3 usage (Markdown style)."""
        headings = []
        for line in content.split('\n'):
            if line.startswith('## '):
                headings.append({"level": 2, "text": line.replace('## ', '').strip()})
            elif line.startswith('### '):
                headings.append({"level": 3, "text": line.replace('### ', '').strip()})
        return headings

    def analyze_content(self, title: str, content: str, keyword: str) -> Dict[str, Any]:
        """Comprehensive SEO analysis."""
        score = 0
        issues = []
        
        # 1. Title Analysis
        if keyword and keyword in title:
            score += 20
        else:
            issues.append("제목에 키워드가 포함되지 않았습니다.")

        # 2. Length Analysis
        char_count = len(content)
        if char_count >= 1500:
            score += 20
        elif char_count >= 1000:
            score += 10
            issues.append("글 분량이 조금 부족합니다. (권장: 1500자 이상)")
        else:
            issues.append("글 분량이 너무 적습니다. 더 자세히 작성해주세요.")

        # 3. Keyword Density
        kw_analysis = self.analyze_keyword_density(content, keyword)
        if kw_analysis["status"] == "good":
            score += 20
        elif kw_analysis["status"] == "low":
            score += 10
            issues.append(f"키워드 '{keyword}' 사용이 부족합니다. (현재: {kw_analysis['count']}회)")
        else:
            score += 10
            issues.append("키워드가 너무 많이 사용되었습니다. (과도한 반복 주의)")

        # 4. Heading Structure
        headings = self.check_heading_structure(content)
        if len(headings) >= 3:
            score += 20
        else:
            score += 10
            issues.append("소제목(H2, H3)을 더 활용하여 구조를 잡아주세요.")

        # 5. Image Check (Mock - checking for markdown image syntax)
        if "![" in content:
            score += 20
        else:
            issues.append("이미지가 하나 이상 포함되어야 합니다.")

        return {
            "score": min(100, score),
            "issues": issues,
            "details": {
                "char_count": char_count,
                "reading_time": self.calculate_reading_time(content),
                "keyword_stats": kw_analysis,
                "headings": len(headings)
            }
        }

    def generate_schema(self, article: Dict[str, Any]) -> Dict[str, Any]:
        """Generate JSON-LD Schema."""
        return {
            "@context": "https://schema.org",
            "@type": "Article",
            "headline": article.get("title"),
            "image": [article.get("image")] if article.get("image") else [],
            "datePublished": article.get("date"),
            "author": {
                "@type": "Person",
                "name": article.get("lawyer_name", "변호사")
            }
        }

seo_helper = SEOHelper()

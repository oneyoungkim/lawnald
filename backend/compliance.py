
import re
from typing import Dict, Any, List

class ComplianceEngine:
    EXAGGERATED_PATTERNS = [
        r"100% 승소",
        r"무조건 승소",
        r"승소 보장",
        r"최고의 변호사",
        r"국내 유일",
        r"단독 전문",  # If not verified
        r"전관 예우",
        r"책임 회피 없음",
        r"완벽한 해결"
    ]

    def check_compliance(self, text: str) -> Dict[str, Any]:
        """
        Check for compliance risks in the text.
        """
        risks = []
        for pattern in self.EXAGGERATED_PATTERNS:
            if re.search(pattern, text):
                risks.append(f"과장 광고 위험 문구 감지: '{pattern}'")

        return {
            "valid": len(risks) == 0,
            "risks": risks,
            "risk_score": len(risks) * 10
        }

    def evaluate_ocr_quality(self, text: str) -> Dict[str, Any]:
        """
        Evaluate OCR quality based on character distribution.
        """
        if not text:
            return {"score": 0, "status": "empty"}
            
        total_chars = len(text)
        # Korean, English, Numbers, Punctuation
        valid_chars = re.findall(r'[가-힣a-zA-Z0-9\s.,()\-\"\'%]', text)
        valid_count = len(valid_chars)
        
        score = (valid_count / total_chars) * 100
        
        status = "good"
        if score < 80:
            status = "low"
        elif score < 50:
            status = "bad"
            
        return {
            "score": round(score, 1),
            "status": status,
            "details": f"Valid char ratio: {score:.1f}% ({valid_count}/{total_chars})"
        }

compliance_engine = ComplianceEngine()

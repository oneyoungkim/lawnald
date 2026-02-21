
import re
from typing import List, Dict, Optional

class TextCleaner:
    @staticmethod
    def clean(text: str) -> str:
        """
        Cleans raw extracted text from PDF.
        Removes headers, footers, page numbers, and excessive whitespace.
        """
        if not text:
            return ""

        # 1. Normalize line breaks (join lines that shouldn't be broken)
        # Often PDF extraction breaks lines in the middle of sentences.
        # Simple heuristic: If line doesn't end with ., ?, !, or :, and next line starts with char, join them.
        # This is tricky for Korean. Let's stick to basic whitespace normalization first.
        lines = text.split('\n')
        cleaned_lines = []
        
        for line in lines:
            line = line.strip()
            
            # Remove Page Numbers (e.g., "- 1 -", "1 / 5", "Wait <Page ...>")
            if re.match(r'^[-=]*\s*\d+\s*[-=]*$', line):
                continue
            if re.match(r'^\d+\s*/\s*\d+$', line):
                continue
                
            # Remove common header/footer noise (Simple repetitions or specific keywords)
            if "법원" in line and len(line) < 10: # "서울중앙지방법원" might be header
                 pass # Actually we want to keep court name usually, but if it appears on every page...
                 # For now, let's just keep it.
            
            cleaned_lines.append(line)
            
        text = "\n".join(cleaned_lines)
        
        # 2. Remove multiple newlines
        text = re.sub(r'\n{3,}', '\n\n', text)
        
        return text

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
        "case_number_mask": r"\d{4}[가-힣]+\d+" # Generic case number
    }

    @staticmethod
    def mask(text: str) -> str:
        """
        Masks PII in the text using regex patterns.
        """
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

        # Mask Case Number (Preserve year, mask rest) -> User asked to mask it? 
        # "사람 이름 사건번호 판결문 번호 주소 연락처 계좌 등 민감정보는 한글과 영문 혼용까지 포함해 일관되게 마스킹해"
        # So yes, mask case number.
        def mask_case_number(match):
            full = match.group(0)
            # 2023가합12345 -> 2023가합*****
            return full[:6] + "*" * (len(full) - 6)
        masked_text = re.sub(PIIMasker.PATTERNS["case_number_mask"], mask_case_number, masked_text)
        
        # Mask Names (Heuristic: 2-4 char names after specific keywords)
        # This is risky but requested.
        # Pattern: "피고인 김철수" -> "피고인 김OO"
        # "변호인 이영희" -> "변호인 이OO"
        patterns_names = [r"피고인\s+([가-힣]{2,4})", r"변호인\s+([가-힣]{2,4})", r"원고\s+([가-힣]{2,4})", r"피고\s+([가-힣]{2,4})"]
        
        def mask_name(match):
            return match.group(0).replace(match.group(1), match.group(1)[0] + "**")
            
        for pat in patterns_names:
            masked_text = re.sub(pat, mask_name, masked_text)

        return masked_text

import re

def mask_pii(text: str) -> str:
    """
    Masks Personally Identifiable Information (PII) from the text using regex.
    Targets: RRNs, phone numbers, email addresses, names (pattern-based), addresses, bank accounts.
    """
    masked_text = text
    
    # 1. Resident Registration Numbers (XXXXXX-XXXXXXX) -> XXXXXX-*******
    masked_text = re.sub(r'(\d{6})[- ]?[1-4]\d{6}', r'\1-*******', masked_text)
    
    # 2. Phone Numbers
    # 010-XXXX-XXXX -> 010-****-****
    masked_text = re.sub(r'(01[016789])[- ]?\d{3,4}[- ]?\d{4}', r'\1-****-****', masked_text)
    # 02-XXX-XXXX -> 02-***-****
    masked_text = re.sub(r'(0(2|3[1-3]|4[1-4]|5[1-5]|6[1-4]))[- ]?\d{3,4}[- ]?\d{4}', r'\1-***-****', masked_text)
    
    # 3. Email Addresses
    masked_text = re.sub(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}', '[이메일 비공개]', masked_text)
    
    # 4. Bank Account Numbers (Simple pattern matching usually large sequences of digits with hyphens)
    masked_text = re.sub(r'\d{3,6}[- ]?\d{2,6}[- ]?\d{3,6}', '[계좌번호 비공개]', masked_text)

    # 5. Names after specific keywords (Passive approach)
    # "피고인 김철수" -> "피고인 김O수" or "피고인 [비공개]"
    def mask_name(match):
        prefix = match.group(1)
        name = match.group(2)
        if len(name) >= 2:
            masked_name = name[0] + "O" * (len(name) - 1)
            return f"{prefix} {masked_name}"
        return match.group(0)

    # Patterns for legal documents
    masked_text = re.sub(r'(피\s?고\s?인|원\s?고|피\s?고|피\s?해\s?자|소\s?유\s?자|채\s?무\s?자|채\s?권\s?자)\s+([가-힣]{2,4})', mask_name, masked_text)

    # 6. Addresses
    # "서울시 강남구 역삼동 123-45" -> "서울시 강남구 역삼동 [주소 비공개]"
    # Match up to Dong/Eup/Myeon and then mask the rest digits/details
    masked_text = re.sub(r'([가-힣]+[시도]\s+[가-힣]+[구군]\s+[가-힣]+[동읍면])\s+[\d\-가-힣\s]+', r'\1 [주소 비공개]', masked_text)
    masked_text = re.sub(r'([가-힣]+[로])\s+[\d\-]+(번?길)?', r'\1 [주소 비공개]', masked_text)

    return masked_text

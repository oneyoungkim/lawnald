import pypdf
import io

def extract_text_from_pdf(file_bytes: bytes, min_text_length: int = 200) -> tuple[str, bool]:
    """
    Extracts text from a PDF file.
    Returns a tuple: (extracted_text, is_scanned)
    
    is_scanned is True if the extracted text length is less than min_text_length.
    """
    try:
        reader = pypdf.PdfReader(io.BytesIO(file_bytes))
        text = ""
        for page in reader.pages:
            extracted = page.extract_text()
            if extracted:
                text += extracted + "\n"
            
        clean_text = text.strip()
        
        # Heuristic: if text is too short, treat as scanned/image-only
        is_scanned = len(clean_text) < min_text_length
        
        return clean_text, is_scanned
    except Exception as e:
        print(f"Error extracting text from PDF: {e}")
        return "", True

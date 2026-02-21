
import sys
print(f"sys.path: {sys.path}")
try:
    import pdfplumber
    print("pdfplumber imported successfully")
except ImportError as e:
    print(f"pdfplumber import failed: {e}")
except Exception as e:
    print(f"pdfplumber import crashed: {e}")

try:
    import fitz
    print("fitz imported successfully")
    print(f"fitz file: {fitz.__file__}")
except ImportError as e:
    print(f"fitz import failed: {e}")

try:
    import pymupdf
    print("pymupdf imported successfully")
    print(f"pymupdf file: {pymupdf.__file__}")
except ImportError as e:
    print(f"pymupdf import failed: {e}")

import sys
import os

# Add current directory to sys.path
sys.path.append(os.getcwd())
sys.path.append(os.path.join(os.getcwd(), "backend"))

from backend.case_parser_v2 import case_parser

pdf_path = r"backend/backend/uploads/cases/welder49264@naver.com/de316932-b074-4576-8913-94922bee4957.pdf"
# Check if file exists, if not use any pdf in temp_uploads
if not os.path.exists(pdf_path):
    print(f"File {pdf_path} not found. Searching for any PDF...")
    import glob
    pdfs = glob.glob("backend/temp_uploads/*.pdf")
    if pdfs:
        pdf_path = pdfs[0]
        print(f"Using {pdf_path}")
    else:
        print("No PDF found.")
        sys.exit(1)

print(f"Testing extraction on {pdf_path}")
text = case_parser.extract_text_from_pdf(pdf_path)
print(f"Extracted text length: {len(text)}")

try:
    if len(text) > 100:
        print("Text sufficient. Calling parse_structure...")
        data = case_parser.parse_structure(text)
    else:
        print("Text insufficient. Calling parse_from_images...")
        data = case_parser.parse_from_images(pdf_path)

    print(f"Returned Data Keys: {list(data.keys())}")
    print(f"Facts: {data.get('facts')}")
    print(f"Facts len: {len(data.get('facts', ''))}")
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()

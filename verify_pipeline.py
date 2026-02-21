
import requests
import json
import os

BASE_URL = "http://localhost:8000"
LAWYER_ID = "welder49264@naver.com" # Updated to match data.py
# We will read from response of db check if needed, but 'kim_won_young' was the test user.

def verify_pipeline():
    print("1. Testing PDF Upload...")
    # Correct path based on find_by_name result
    pdf_path = r"backend/backend/uploads/cases/welder49264@naver.com/de316932-b074-4576-8913-94922bee4957.pdf"
    
    if not os.path.exists(pdf_path):
        # Try to find any PDF in nested backend structure
        for root, dirs, files in os.walk("."): # Start from CWD
            for f in files:
                if f.endswith(".pdf"):
                    found_path = os.path.join(root, f)
                    if "uploads" in found_path:
                        pdf_path = found_path
                        break
    
    print(f"Using PDF: {pdf_path}")
    
    files = {'file': open(pdf_path, 'rb')}
    response = requests.post(f"{BASE_URL}/api/cases/upload", files=files)
    
    if response.status_code != 200:
        print(f"Upload Failed: {response.status_code} {response.text}")
        return
    
    data = response.json()
    print("Upload Success!")
    print(f"Extracted Title: {data.get('title')}")
    print(f"Upload Response Keys: {list(data.keys())}")
    print(f"Full Upload Response: {json.dumps(data, indent=2, ensure_ascii=False)[:500]}...") # Print first 500 chars
    print(f"Facts length: {len(data.get('facts', ''))}")
    if 'facts' in data:
        print(f"Facts content: '{data['facts']}'")
    print(f"Issues length: {len(data.get('issues', ''))}")
    
    if "Server Logic Debug Failure" in str(data.get('client_story')):
        print("!!! VERIFICATION FAILED: Error message detected in Client Story !!!")
    elif len(data.get('facts', '')) < 10:
         print("!!! VERIFICATION FAILED: Facts field is empty or too short !!!")
    else:
        print("VERIFICATION SUCCESS: Fields extracted successfully.")
    
    # 2. Publish Case
    print("\n2. Publishing Case...")
    
    # Construct publish payload using extracted data
    publish_payload = {
        "case_number": data.get("case_number", "2024가합1234"),
        "court": data.get("court", "서울중앙지방법원"),
        "title": data.get("title", "Test Case"),
        "summary": data.get("summary_one_line") or data.get("summary", "Summary"),
        "facts": data.get("facts") or data.get("case_background", "Facts"),
        "decision": data.get("result", "Result"),
        "full_text": data.get("full_text", ""),
        "lawyer_id": LAWYER_ID,
        "issues": data.get("issues") or data.get("key_issues", "Issues"),
        "reasoning": data.get("reasoning") or data.get("defense_strategy", "Reasoning"),
        "conclusion": data.get("conclusion") or data.get("result", "Conclusion"),
        "client_story": data.get("client_story", ""),
        "ai_tags": data.get("ai_tags", ""),
        
        # New Fields
        "case_type": data.get("case_type", ""),
        "keywords": data.get("keywords", []),
        "evidence_list": data.get("evidence_list", []),
        "procedure_stage": data.get("procedure_stage", ""),
        "result_amount": data.get("result_amount", ""),
        
        "file_hash": data.get("file_hash", ""),
        "ocr_quality_score": data.get("ocr_quality_score", 0.0),
        "risk_flags": data.get("risk_flags", [])
    }
    
    pub_res = requests.post(f"{BASE_URL}/api/cases/publish", json=publish_payload)
    
    if pub_res.status_code != 200:
        print(f"Publish Failed: {pub_res.status_code} {pub_res.text}")
        return
        
    pub_data = pub_res.json()
    print("Publish Success!")
    print(json.dumps(pub_data, indent=2, ensure_ascii=False))
    
    # 3. Verify in Lawyer DB
    print("\n3. Verifying in Lawyer DB...")
    db_res = requests.get(f"{BASE_URL}/api/lawyers/{LAWYER_ID}")
    lawyer_data = db_res.json()
    
    cases = [c for c in lawyer_data.get("content_items", []) if c["type"] == "case"]
    if cases:
        latest = cases[0]
        print(f"Latest Case Status: {latest.get('status')}")
        print(f"Latest Case Risks: {latest.get('structured_data', {}).get('risks')}")
    else:
        print("No cases found in DB!")

if __name__ == "__main__":
    verify_pipeline()

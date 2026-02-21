import requests
import json
import time

BASE_URL = "http://localhost:8001"

LAWYER_ID = "welder49264@naver.com"

# Fix Windows console encoding for Korean/Emojis
import sys
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except AttributeError:
        # Python < 3.7 fallback
        import io
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

def verify_pipeline():
    print("=== Starting Simplified Pipeline Verification ===")
    
    # 1. Upload Case PDF
    print("\n[Step 1] Uploading Case PDF...")
    try:
        # Use a real PDF found in workspace
        source_pdf = "backend/backend/uploads/cases/welder49264@naver.com/de316932-b074-4576-8913-94922bee4957.pdf"
        temp_pdf = "backend/test_case_unique.pdf"
        
        # Copy and append timestamp to make hash unique
        with open(source_pdf, "rb") as f:
            content = f.read()
        
        with open(temp_pdf, "wb") as f:
            f.write(content)
            f.write(str(time.time()).encode()) # Make hash unique
            
        with open(temp_pdf, "rb") as f:
            files = {"file": ("test_case.pdf", f, "application/pdf")}
            res = requests.post(f"{BASE_URL}/api/cases/upload", files=files)
            
        if res.status_code != 200:
            print(f"FAILED: Upload returned {res.status_code}")
            print(res.text)
            return

        data = res.json()
        print("SUCCESS: PDF Uploaded and parsed.")
        print(f"Generated Title: {data.get('title')}")
        print(f"Story Sample: {data.get('client_story')[:100]}...")
        file_hash = data.get("file_hash")
        
    except Exception as e:
        print(f"ERROR: {e}")
        return

    # 2. Publish (Submit for Approval)
    print("\n[Step 2] Submitting for Approval...")
    # NOTE: upload returns 'client_story', but publish expects 'story'
    publish_payload = {
        "case_number": data.get("case_number", "2024-TEST-123") or "2024-MOCK-123",
        "court": data.get("court", "Central District") or "Mock Court",
        "title": data.get("title") or "Unnamed Case",
        "story": data.get("client_story") or "No story generated",
        "full_text": data.get("full_text") or "Empty full text",
        "lawyer_id": LAWYER_ID,
        "file_hash": file_hash,
        "ai_tags": data.get("ai_tags", "test, verification"),
        "summary": "This is a test summary.",
        "facts": data.get("facts") or "No facts extracted"
    }

    
    res = requests.post(f"{BASE_URL}/api/cases/publish", json=publish_payload)
    if res.status_code != 200:
        print(f"FAILED: Publish returned {res.status_code}")
        try:
             print(json.dumps(res.json(), indent=2, ensure_ascii=False))
        except:
             print(res.text)
        return
    
    p_data = res.json()
    case_id = p_data.get("case_id")
    print(f"SUCCESS: Submitted for approval. Case ID: {case_id}")

    # 3. Check Admin Drafts
    print("\n[Step 3] Checking Admin Drafts...")
    res = requests.get(f"{BASE_URL}/api/admin/drafts")
    if res.status_code != 200:
        print(f"FAILED: GET drafts returned {res.status_code}")
        print(res.text)
        return
        
    drafts = res.json()
    
    target_draft = next((d for d in drafts if d["id"] == case_id), None)
    if target_draft:
        print(f"SUCCESS: Case {case_id} found in Admin Drafts.")
    else:
        print(f"FAILED: Case {case_id} NOT found in Admin Drafts.")
        # Print first few drafts for debug
        if drafts:
             print(f"Found {len(drafts)} other drafts. First one: {drafts[0].get('id')}")
        return

    # 4. Approve Case
    print("\n[Step 4] Approving Case...")
    approve_payload = {
        "case_id": case_id,
        "lawyer_id": LAWYER_ID
    }
    res = requests.post(f"{BASE_URL}/api/admin/cases/approve", json=approve_payload)
    if res.status_code != 200:
        print(f"FAILED: Approval returned {res.status_code}")
        try:
             print(json.dumps(res.json(), indent=2, ensure_ascii=False))
        except:
             print(res.text)
        return
    
    a_data = res.json()
    print(f"SUCCESS: {a_data.get('message')}")
    print(f"New Lawyer Score: {a_data.get('new_score')}")

    # 5. Verify status is 'published'
    print("\n[Step 5] Final verification of status...")
    res = requests.get(f"{BASE_URL}/api/admin/drafts")
    drafts = res.json()
    if not any(d["id"] == case_id for d in drafts):
        print("SUCCESS: Case is no longer in pending drafts.")
    else:
        print("FAILED: Case is STILL in pending drafts!")

    print("\n=== Pipeline Verification Complete ===")

if __name__ == "__main__":
    import os
    verify_pipeline()

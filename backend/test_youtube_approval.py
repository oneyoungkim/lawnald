
import requests
import json
import time

BASE_URL = "http://localhost:8000"
LAWYER_ID = "welder49264@naver.com"

def test_approval_flow():
    title = f"Approval Test Video {int(time.time())}"
    print(f"--- Starting Test for '{title}' ---")
    
    # 1. Submit
    print("\n1. Submitting Content...")
    url = f"{BASE_URL}/api/lawyers/{LAWYER_ID}/content"
    payload = {
        "type": "youtube",
        "title": title,
        "url": "https://youtu.be/approval_test",
        "tags": ["test", "approval"]
    }
    res = requests.post(url, json=payload)
    if res.status_code != 200:
        print(f"Submission failed: {res.text}")
        return
    print("Submission successful.")
    
    # 2. Verify NOT in Magazine
    print("\n2. Checking Magazine (Should NOT be here)...")
    res = requests.get(f"{BASE_URL}/api/magazine")
    articles = res.json()
    if any(a["title"] == title for a in articles):
        print("FAIL: Found unapproved content in magazine!")
        return
    print("Success: Not found in magazine.")
    
    # 3. Find in Admin Pending
    print("\n3. Finding in Admin Pending List...")
    res = requests.get(f"{BASE_URL}/api/admin/submissions?status=pending")
    submissions = res.json()
    target_sub = next((s for s in submissions if s["title"] == title), None)
    
    if not target_sub:
        print("FAIL: Not found in admin pending list!")
        return
    
    sub_id = target_sub["id"]
    print(f"Found Pending Submission ID: {sub_id}")
    
    # 4. Approve
    print(f"\n4. Approving Submission {sub_id}...")
    res = requests.post(f"{BASE_URL}/api/admin/submissions/{sub_id}/approve")
    if res.status_code != 200:
        print(f"Approval failed: {res.text}")
        return
    print("Approval successful.")
    
    # 5. Verify IN Magazine
    print("\n5. Checking Magazine (Should BE here)...")
    res = requests.get(f"{BASE_URL}/api/magazine")
    articles = res.json()
    
    found_article = next((a for a in articles if a["title"] == title), None)
    if found_article:
        print(f"SUCCESS! Found in magazine: {found_article['title']}")
        print(f"URL: {found_article.get('url')}")
    else:
        print("FAIL: Still not not found in magazine after approval.")

if __name__ == "__main__":
    test_approval_flow()

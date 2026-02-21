
import requests
import json
import time

BASE_URL = "http://localhost:8000"
ADMIN_API = f"{BASE_URL}/api/admin"
LAWYER_ID = "welder49264@naver.com"

def test_magazine_management():
    print("--- Starting Magazine Management Test ---")
    
    # 1. Create Dummy Content
    print("\n1. Creating Dummy Content...")
    title = f"Delete Me {int(time.time())}"
    res = requests.post(f"{BASE_URL}/api/lawyers/{LAWYER_ID}/content", json={
        "type": "column",
        "title": title,
        "content": "This content should be deleted.",
        "tags": ["test"]
    })
    if res.status_code != 200:
        print(f"Failed to create content: {res.text}")
        return
    content_id = res.json()["item"]["id"]
    print(f"Created Content ID: {content_id}")
    
    # 1.5 Approve Content (so it appears in magazine list via content_items)
    print(f"\n1.5 Approving Content {content_id}...")
    res = requests.post(f"{ADMIN_API}/submissions/{content_id}/approve")
    if res.status_code != 200:
        # Try finding it in pending submissions first? Content ID from submission might be different?
        # In submit_general_content, new_submission["id"] is returned.
        # So we should be able to approve it.
        print(f"Approval failed: {res.text}")
        return
    print("Content Approved.")

    # 2. List All (Verify presence)
    print("\n2. Listing All Magazine Content...")
    res = requests.get(f"{ADMIN_API}/magazine/all")
    print(f"List Response Status: {res.status_code}")
    if res.status_code != 200:
        print(f"List failed: {res.text}")
        return
        
    items = res.json()
    # print(f"Items: {items}") # Uncomment if needed
    found = next((i for i in items if i["id"] == content_id), None)
    if not found:
        print("FAIL: Created content not found in list.")
        return
    print(f"Success: Found '{found['title']}' in list.")
    
    # 3. Toggle Visibility
    print(f"\n3. Toggling Visibility for {content_id}...")
    initial_status = found["verified"]
    res = requests.post(f"{ADMIN_API}/content/{content_id}/toggle-visibility")
    if res.status_code != 200:
        print(f"Toggle failed: {res.text}")
        return
    new_status = res.json()["verified"]
    print(f"Status changed: {initial_status} -> {new_status}")
    if initial_status == new_status:
         print("FAIL: Status did not change.")
    
    # 4. Delete
    print(f"\n4. Deleting Content {content_id}...")
    res = requests.delete(f"{ADMIN_API}/content/{content_id}")
    if res.status_code != 200:
        print(f"Delete failed: {res.text}")
        return
    print("Delete successful.")
    
    # 5. Verify Deletion
    print("\n5. Verifying Deletion...")
    res = requests.get(f"{ADMIN_API}/magazine/all")
    items = res.json()
    found = next((i for i in items if i["id"] == content_id), None)
    if found:
        print("FAIL: Content still exists after deletion.")
    else:
        print("SUCCESS: Content effectively deleted.")

if __name__ == "__main__":
    test_magazine_management()

import requests
import json
import time

BASE_URL = "http://localhost:8000"
LAWYER_ID = "lawyer_1" 

def test_consultation_flow():
    print("1. Testing Next Best Action API...")
    try:
        res = requests.get(f"{BASE_URL}/api/dashboard/actions?lawyer_id={LAWYER_ID}")
        if res.status_code == 200:
            actions = res.json()
            print(f"✅ Actions received: {len(actions)}")
            for action in actions:
                print(f"   - {action['title']} ({action['priority']})")
        else:
            print(f"❌ Failed to fetch actions: {res.status_code}")
    except Exception as e:
        print(f"❌ Error fetching actions: {str(e)}")

    print("\n2. Testing Consultation Analysis (Mocking LLM or Real)...")
    # Note: If no OpenAI Key, the backend typically fails or returns mock if implemented.
    # My implementation uses real OpenAI, so it might fail if key is missing.
    # But I added a try-except block in backend/consultation.py to return fallback.
    
    sample_text = """
    의뢰인: 김철수 (30대 남성)
    내용: 아내가 직장 동료와 부정행위를 저지른 것을 알게 되었습니다. 
    증거로는 카카오톡 대화 내용과 모텔 출입 CCTV 사진을 확보했습니다. 
    이혼 소송과 함께 상간남 위자료 청구 소송을 진행하고 싶습니다. 
    재산분할은 아파트가 하나 있는데 제 명의입니다. 
    양육권은 제가 가져오고 싶습니다. 아이는 5살 딸입니다.
    """
    
    payload = {
        "text": sample_text,
        "lawyer_id": LAWYER_ID
    }
    
    try:
        res = requests.post(f"{BASE_URL}/api/consultations", json=payload)
        
        if res.status_code == 200:
            consultation = res.json()
            print(f"✅ Consultation Created: {consultation['id']}")
            print(f"   - Title: {consultation['case_title']}")
            print(f"   - Area: {consultation['primary_area']}")
            print(f"   - Confidence: {consultation['confidence']}")
            print(f"   - Summary: {consultation['summary'][:50]}...")
            
            # Verify details
            if consultation['key_facts']:
                print(f"   - Key Facts: {len(consultation['key_facts'])} items")
            if consultation['checklist']:
                print(f"   - Checklist: {len(consultation['checklist'])} items")
                
            return consultation['id']
        else:
            print(f"❌ Failed to create consultation: {res.status_code} {res.text}")
            return None
            
    except Exception as e:
        print(f"❌ Error creating consultation: {str(e)}")
        return None

def test_consultation_list(consultation_id):
    if not consultation_id: return
    
    print("\n3. Testing Consultation List & Detail...")
    try:
        # List
        res = requests.get(f"{BASE_URL}/api/consultations?lawyer_id={LAWYER_ID}")
        if res.status_code == 200:
            list_data = res.json()
            print(f"✅ List fetched: {len(list_data)} items")
            found = any(c['id'] == consultation_id for c in list_data)
            if found:
                print("   - Created consultation found in list.")
            else:
                print("   - ❌ Created consultation NOT found in list.")
        
        # Detail
        res = requests.get(f"{BASE_URL}/api/consultations/{consultation_id}")
        if res.status_code == 200:
            print(f"✅ Detail fetched successfully.")
        else:
            print(f"❌ Failed to fetch detail: {res.status_code}")
            
    except Exception as e:
        print(f"❌ Error testing list/detail: {str(e)}")

if __name__ == "__main__":
    cid = test_consultation_flow()
    test_consultation_list(cid)

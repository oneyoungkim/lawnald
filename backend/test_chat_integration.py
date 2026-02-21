
import requests
import json

BASE_URL = "http://localhost:8000"

def test_create_consultation_with_chat_id():
    payload = {
        "text": "This is a test consultation to verify chat integration.",
        "lawyer_id": "lawyer1", # Assuming lawyer1 exists or ID verification is skipped
        "chat_client_id": "client_session_12345"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/api/consultations", json=payload)
        response.raise_for_status()
        data = response.json()
        
        print("Consultation created:", data['id'])
        
        # Verify chat_client_id in response
        if data.get('chat_client_id') == "client_session_12345":
            print("SUCCESS: chat_client_id matches.")
        else:
            print(f"FAILURE: chat_client_id mismatch. Got: {data.get('chat_client_id')}")

        # Fetch all consultations to verify persistence
        res_all = requests.get(f"{BASE_URL}/api/consultations?lawyer_id=lawyer1")
        all_data = res_all.json()
        found = next((c for c in all_data if c['id'] == data['id']), None)
        
        if found and found.get('chat_client_id') == "client_session_12345":
            print("SUCCESS: chat_client_id persisted.")
        else:
             print(f"FAILURE: chat_client_id not found in list. Found: {found}")

    except Exception as e:
        print(f"Error: {e}")
        if hasattr(e, 'response') and e.response:
             print(e.response.text)

if __name__ == "__main__":
    test_create_consultation_with_chat_id()


import requests
import json

BASE_URL = "http://localhost:8000"

def test_get_lawyer_chats():
    # 1. Real data from chats.json (based on previous steps)
    lawyer_id = "lawyer1@example.com"
    
    url = f"{BASE_URL}/api/lawyers/{lawyer_id}/chats"
    print(f"Testing URL: {url}")
    
    try:
        response = requests.get(url)
        
        if response.status_code == 404:
            print("FAILURE: Endpoint not found (404). Server might differ from code.")
            return

        response.raise_for_status()
        data = response.json()
        print("SUCCESS: Endpoint responded.")
        print(f"Data count: {len(data)}")
        print(f"Data: {json.dumps(data, indent=2)}")
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_get_lawyer_chats()

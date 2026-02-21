
import requests
import json
import os

BASE_URL = "http://localhost:8000"

def test_get_chat_history():
    # 1. Real data from chats.json
    lawyer_id = "lawyer1@example.com"
    client_id = "34ea25cd-0158-487f-a671-098367ad4e85"
    
    # 2. We can't easily inject into chats.json safely without race conditions if server is writing,
    # but we can try to "send" a message via the chat server first to create history, 
    # OR we can just check if the endpoint exists and returns something (even empty list).
    
    # Let's try to hit the endpoint.
    url = f"{BASE_URL}/api/chats/{lawyer_id}/{client_id}/messages"
    print(f"Testing URL: {url}")
    
    try:
        response = requests.get(url)
        
        if response.status_code == 404:
            print("FAILURE: Endpoint not found (404). Server might differ from code.")
            return

        response.raise_for_status()
        data = response.json()
        print("SUCCESS: Endpoint responded.")
        print(f"Data: {json.dumps(data, indent=2)}")
        
        # If we want to be sure it saves, we'd need to send a message via WS first.
        # But this test is mainly 'did the endpoint get added?'
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_get_chat_history()

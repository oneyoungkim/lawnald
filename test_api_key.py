import requests
import json

def test_consultation():
    url = "http://localhost:8000/api/consultations"
    payload = {
        "lawyer_id": "lawyer_1",
        "text": "남편이 바람을 피워서 이혼하고 싶습니다. 위자료는 얼마나 받을 수 있을까요?"
    }
    headers = {"Content-Type": "application/json"}
    
    try:
        print("Sending request to API...")
        response = requests.post(url, json=payload, headers=headers)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("Success!")
            print(f"Title: {data.get('case_title')}")
            print(f"Summary: {data.get('summary')}")
        else:
            print("Failed.")
            print(response.text)
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_consultation()

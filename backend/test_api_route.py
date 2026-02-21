import requests

try:
    print("Checking test route...")
    res = requests.get("http://localhost:8000/api/test_chat_route")
    print(f"Status: {res.status_code}")
    print(f"Response: {res.json()}")
except Exception as e:
    print(f"Failed: {e}")

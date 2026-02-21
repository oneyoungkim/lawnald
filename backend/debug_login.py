
import requests
import json

url = "http://localhost:8000/api/auth/login"
payload = {
    "email": "welder49264@naver.com",
    "password": "any_password"
}
headers = {'Content-Type': 'application/json'}

try:
    response = requests.post(url, json=payload)
    print(f"Status Code: {response.status_code}")
    print(f"Response Body: {response.text}")
except Exception as e:
    print(f"Request failed: {e}")

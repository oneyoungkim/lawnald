
import requests
import json
import time

url = "http://localhost:8000/api/recommend"
params = {"q": "폭행으로 고소당했습니다"}

print(f"Sending request to {url} with params {params}...")
start_time = time.time()
try:
    response = requests.get(url, params=params, timeout=30)
    elapsed = time.time() - start_time
    print(f"Response received in {elapsed:.2f} seconds.")
    print(f"Status Code: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print("Keys in response:", data.keys())
        if "lawyers" in data:
            print(f"Found {len(data['lawyers'])} lawyers.")
            if len(data["lawyers"]) > 0:
                print("First lawyer:", data["lawyers"][0]["name"])
        else:
            print("No 'lawyers' key in response.")
    else:
        print("Error response:", response.text)
except Exception as e:
    print(f"Request failed: {e}")

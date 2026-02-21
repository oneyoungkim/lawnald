
import requests
import json

try:
    print("Checking root...")
    res = requests.get("http://localhost:8000/")
    print(f"Root: {res.status_code} {res.json()}")
    
    print("Checking admin lawyers...")
    res = requests.get("http://localhost:8000/api/admin/lawyers")
    print(f"Lawyers: {res.status_code} (Count: {len(res.json())})")
    
    print("Checking pending lawyers...")
    res = requests.get("http://localhost:8000/api/admin/lawyers/pending")
    print(f"Pending: {res.status_code} (Count: {len(res.json())})")

except Exception as e:
    print(f"Failed to connect: {e}")

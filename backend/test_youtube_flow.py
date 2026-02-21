
import requests
import json

BASE_URL = "http://localhost:8000"
LAWYER_ID = "welder49264@naver.com"

def test_youtube_flow():
    print("1. Submitting YouTube Content...")
    url = f"{BASE_URL}/api/lawyers/{LAWYER_ID}/content"
    payload = {
        "type": "youtube",
        "title": "Test Video for Magazine",
        "url": "https://youtu.be/test1234",
        "tags": ["test", "magazine"]
    }
    
    try:
        res = requests.post(url, json=payload)
        if res.status_code != 200:
            print(f"Failed to submit: {res.text}")
            return
        
        print("Submission successful.")
        
        print("2. Checking Magazine API...")
        res = requests.get(f"{BASE_URL}/api/magazine")
        articles = res.json()
        
        found = False
        for article in articles:
            if article["title"] == "Test Video for Magazine" and article["type"] == "youtube":
                print(f"Success! Found article in magazine: {article['title']}")
                print(f"Summary: {article['summary']}")
                found = True
                break
        
        if not found:
            print("Failed: Article not found in magazine list.")
            print("Current articles types:", [a["type"] for a in articles])

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_youtube_flow()

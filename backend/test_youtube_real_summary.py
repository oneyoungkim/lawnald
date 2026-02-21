
import requests
import json
import time

BASE_URL = "http://localhost:8000"
LAWYER_ID = "welder49264@naver.com"
VIDEO_URL = "https://www.youtube.com/watch?v=d4V5Jesht0c" # User provided URL

def test_real_summary():
    print(f"--- Starting Real Summary Test for {VIDEO_URL} ---")
    
    title = f"Real Summary Test {int(time.time())}"
    
    # 1. Submit
    print("\n1. Submitting Content...")
    url = f"{BASE_URL}/api/lawyers/{LAWYER_ID}/content"
    payload = {
        "type": "youtube",
        "title": title,
        "url": VIDEO_URL,
        "tags": ["test", "real_summary"]
    }
    
    start_time = time.time()
    res = requests.post(url, json=payload)
    duration = time.time() - start_time
    
    if res.status_code != 200:
        print(f"Submission failed: {res.text}")
        return
    
    data = res.json()
    item = data.get("item", {})
    summary = item.get("summary", "")
    
    print(f"\nSubmission took {duration:.2f} seconds.")
    print("Submission successful.")
    print(f"Summary Length: {len(summary)}")
    print(f"Summary Content Logged to backend/summary_output.txt")
    with open("backend/summary_output.txt", "w", encoding="utf-8") as f:
        f.write(summary)
    
    if "[AI 요약]" in summary and "AI가 생성한 요약입니다" in summary:
        print("\nSUCCESS: Real AI summary generated.")
    elif "자막을 가져올 수 없어" in summary:
        print("\nPARTIAL SUCCESS: Logic worked but transcript fetch failed (maybe no subtitles?).")
    else:
        print("\nFAIL: Seems to have fallen back or failed.")

if __name__ == "__main__":
    test_real_summary()

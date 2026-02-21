
import sys
import os

# Add project root to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.main import generate_youtube_summary

def test_standalone():
    print("Testing generate_youtube_summary standalone...")
    url = "https://www.youtube.com/watch?v=d4V5Jesht0c"
    title = "Standalone Test Video"
    
    summary = generate_youtube_summary(url, title)
    
    print(f"Summary Result:\n{summary}")
    
    if "[AI 요약]" in summary and "AI가 생성한 요약입니다" in summary:
        print("SUCCESS: Summary generated.")
    elif "자막을 가져올 수 없어" in summary:
        print("PARTIAL SUCCESS: Transcript failed (expected if no captions).")
    else:
        print("FAIL: Error occurred.")

if __name__ == "__main__":
    test_standalone()


import sys
import os
from unittest.mock import MagicMock

# 1. Mock External Dependencies
# We need to mock 'main' module context if the function relies on global variables like search_engine
# The function uses:
# - youtube_transcript_api.YouTubeTranscriptApi (imported inside)
# - search_engine.client (global)

# Let's define the function locally to test IT, 
# ensuring we copy it EXACTLY as it is in main.py
# (I will paste the latest version I wrote)

def generate_youtube_summary(url: str, title: str) -> str:
    try:
        from youtube_transcript_api import YouTubeTranscriptApi
        
        # 1. Extract Video ID
        video_id = None
        if "v=" in url:
            video_id = url.split("v=")[1].split("&")[0]
        elif "youtu.be/" in url:
            video_id = url.split("youtu.be/")[1].split("?")[0]
            
        if not video_id:
            return f"[AI 요약 실패] 유효하지 않은 YouTube URL입니다. ({title})"

        # 2. Fetch Transcript (Korean preferred, fallback to others)
        try:
            # Instantiate API
            yt = YouTubeTranscriptApi()
            print(f"Listing transcripts for {video_id}...")
            
            # List all available transcripts
            transcript_list_obj = yt.list(video_id)
            print(f"Transcripts listed: {[t.language_code for t in transcript_list_obj]}")
            
            transcript = None
            try:
                # Try finding Korean (manual or auto)
                print("Looking for 'ko'...")
                transcript = transcript_list_obj.find_transcript(['ko'])
                print(f"Found 'ko': {transcript.is_generated}")
            except Exception as e:
                print(f"Could not find 'ko': {e}")
                try:
                    # Try finding English
                    print("Looking for 'en'...")
                    transcript = transcript_list_obj.find_transcript(['en'])
                    print(f"Found 'en': {transcript.is_generated}")
                except Exception as e2:
                    print(f"Could not find 'en': {e2}")
                    # Fallback: Take the first available transcript
                    # method: iterate and take first
                    for t in transcript_list_obj:
                        transcript = t
                        print(f"Fallback to first available: {t.language_code}")
                        break
            
            if not transcript:
                raise Exception("No transcript found in any language")
                
            # Fetch the actual content
            print(f"Fetching content for {transcript.language_code}...")
            fetched_transcript = transcript.fetch()
            print("Fetch successful.")
            
            raw_data = fetched_transcript.to_raw_data()
            full_text = " ".join([t['text'] for t in raw_data])
            
            # Limit text length for API prompt if too long (e.g., 10000 chars)
            if len(full_text) > 10000:
                full_text = full_text[:10000] + "..."
                
        except Exception as e:
            print(f"Transcript fetch failed: {e}")
            return f"[AI 요약] '{title}' 영상입니다.\n\n(자막을 가져올 수 없어 요약을 생성하지 못했습니다. 영상에서 직접 내용을 확인해주세요. 오류: {e})"

        # 3. Generate Summary via OpenAI
        # We need to access search_engine.client from the global scope of where this runs
        # or we can mock it here.
        if search_engine.client:
            response = search_engine.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": "You are a helpful assistant. Summarize the following YouTube video transcript into 3 key bullet points (~500 characters total) in Korean. Focus on legal advice and key takeaways."},
                    {"role": "user", "content": f"Title: {title}\n\nTranscript:\n{full_text}"}
                ],
                temperature=0.7,
                max_tokens=500
            )
            summary = response.choices[0].message.content.strip()
            return f"[AI 요약]\n{summary}\n\n(AI가 생성한 요약입니다.)"
        else:
            return f"[AI 요약] '{title}' 영상입니다.\n\n(OpenAI 클라이언트가 초기화되지 않아 요약을 생성할 수 없습니다.)"

    except Exception as e:
        print(f"Summarization failed: {e}")
        return f"[AI 요약] '{title}' 영상에 대한 요약 생성을 시도했으나 오류가 발생했습니다."

# 2. Setup Mock Search Engine
class MockSearchEngine:
    def __init__(self):
        self.client = MagicMock()
        # Mock response
        mock_response = MagicMock()
        mock_choice = MagicMock()
        mock_message = MagicMock()
        mock_message.content = "이것은 AI 요약 테스트 결과입니다.\n- 첫 번째 핵심 내용\n- 두 번째 핵심 내용\n- 세 번째 핵심 내용"
        mock_choice.message = mock_message
        mock_response.choices = [mock_choice]
        self.client.chat.completions.create.return_value = mock_response

search_engine = MockSearchEngine()

# 3. Run Tests
print("--- Test 1: Video with Auto-Generated Korean Captions (d4V5Jesht0c) ---")
res1 = generate_youtube_summary("https://www.youtube.com/watch?v=d4V5Jesht0c", "Test Video 1")
print(res1)
print("\n")

print("--- Test 2: Video with NO Captions (jY8hV2I9w9c) ---")
res2 = generate_youtube_summary("https://www.youtube.com/watch?v=jY8hV2I9w9c", "Test Video 2")
print(res2)
print("\n")

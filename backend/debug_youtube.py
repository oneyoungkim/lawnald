
import sys
import os

try:
    with open("backend/debug_output.txt", "w") as f:
        f.write(f"Python Executable: {sys.executable}\n")
        
        import youtube_transcript_api
        from youtube_transcript_api import YouTubeTranscriptApi
        
        try:
            video_id = "jY8hV2I9w9c"
            f.write(f"Attempting to fetch transcript for {video_id} using instance method...\n")
            
            # Instantiate
            api = YouTubeTranscriptApi()
            
            # Try fetch
            # Note: The 'fetch' method in _api.py returns a FetchedTranscript object? 
            # Or does it return the list of dicts directly?
            # Let's check what it returns.
            transcript = api.fetch(video_id, languages=['ko'])
            
            f.write(f"Successfully fetched transcript object type: {type(transcript)}\n")
            f.write(f"Transcript data (first 100 chars): {str(transcript)[:100]}\n")
            
            # If it's not a list, we might need to cast it or access a property
            # But standard get_transcript returns a list.
            
        except Exception as e:
            f.write(f"Instance fetch attempt result: {e}\n")

except Exception as e:
    with open("backend/debug_output.txt", "w") as f:
        f.write(f"Unexpected error: {e}\n")

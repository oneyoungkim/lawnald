
import sys
from youtube_transcript_api import YouTubeTranscriptApi

# Video ID from previous context (jY8hV2I9w9c) or a known video with auto-caps
# Let's try to list for the one that failed: jY8hV2I9w9c
# And maybe another one: d4V5Jesht0c (from test_summary_standalone)
video_ids = ["jY8hV2I9w9c", "d4V5Jesht0c"]

with open("backend/debug_list_output.txt", "w", encoding="utf-8") as f:
    for video_id in video_ids:
        f.write(f"--- Checking Video: {video_id} ---\n")
        try:
            # Based on previous inspection of _api.py, the method is 'list'
            transcript_list = YouTubeTranscriptApi().list(video_id)
            
            f.write(f"Iterating transcripts:\n")
            for transcript in transcript_list:
                f.write(f"  - Lang: {transcript.language} ({transcript.language_code}) | Generated: {transcript.is_generated} | Translatable: {transcript.is_translatable}\n")
                
            # Check find priority
            f.write("Trying to find 'ko':\n")
            try:
                found = transcript_list.find_transcript(['ko'])
                f.write(f"  Found: {found.language_code} (Generated: {found.is_generated})\n")
            except Exception as e:
                f.write(f"  Not found: {e}\n")

            f.write("Trying to find 'en':\n")
            try:
                found = transcript_list.find_transcript(['en'])
                f.write(f"  Found: {found.language_code} (Generated: {found.is_generated})\n")
            except Exception as e:
                f.write(f"  Not found: {e}\n")
                
        except Exception as e:
            f.write(f"Failed to list transcripts: {e}\n")
        f.write("\n")

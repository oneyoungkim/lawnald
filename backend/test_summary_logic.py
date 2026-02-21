
import sys
import os

# Add backend directory
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Mock dependencies / environment BEFORE importing main
# Create dummy 'uploads' directory if it doesn't exist just to pass checks
if not os.path.exists("uploads"):
    os.makedirs("uploads")
if not os.path.exists("data"): # data.py might check this
    os.makedirs("data")

# Also might need to mock embeddings creation in data.py?
import unittest.mock as mock
import sys

# MOCK SearchEngine class to prevent loading real embeddings
mock_search = mock.MagicMock()
sys.modules["backend.search"] = mock_search
sys.modules["search"] = mock_search

if not os.path.exists("backend/embeddings_cache.json"):
    with open("backend/embeddings_cache.json", "w") as f:
        f.write("{}")

from main import generate_youtube_summary

# Mock search_engine.client to avoid actual OpenAI calls if possible, 
# or just let it fail at that step (we care about transcript fetching first)
import main
class MockClient:
    class chat:
        class completions:
            @staticmethod
            def create(*args, **kwargs):
                class Response:
                    class choices:
                        class message:
                            content = "MOCK SUMMARY"
                    choices = [choices]
                return Response()
    
# Only mock if not already set (it might be None in main.py if key is missing)
# But main.py initializes it at module level. 
# We can override it for testing.
main.search_engine.client = MockClient()

print("Testing with video having auto-generated Korean captions (d4V5Jesht0c)...")
result_1 = generate_youtube_summary("https://www.youtube.com/watch?v=d4V5Jesht0c", "Test Video 1")
print(f"Result 1: {result_1}\n")

print("Testing with video having NO captions (jY8hV2I9w9c)...")
result_2 = generate_youtube_summary("https://www.youtube.com/watch?v=jY8hV2I9w9c", "Test Video 2")
print(f"Result 2: {result_2}\n")

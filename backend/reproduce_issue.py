
import sys
import os

# Add backend to sys.path
sys.path.append(os.path.join(os.path.dirname(__file__)))

try:
    from search import search_engine
    print("Search engine initialized.")
    
    query = "이혼 상담 원합니다."
    print(f"Testing search with query: {query}")
    
    # Force load/generate embeddings to trigger API calls
    print("Forcing index refresh...")
    search_engine.refresh_index()
    
    try:
        results = search_engine.search(query)
        print("Search successful!")
        print(results)
    except Exception as e:
        print(f"Search failed with error: {e}")
        import traceback
        traceback.print_exc()

except Exception as e:
    print(f"Failed to import or initialize: {e}")
    import traceback
    traceback.print_exc()

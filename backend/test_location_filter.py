import sys
import os

# Add backend to sys.path
sys.path.append(os.path.join(os.path.dirname(__file__)))

from search import search_engine

def test_location_filter():
    print("Testing Location Filter: 서울...")
    query = "이혼 위자료"
    location = "서울"
    
    try:
        # Force refresh to ensure we have data loaded
        print("Lazy loading/refreshing index...")
        # search_engine.refresh_index() # Optional: might take too long. try without first.
        
        print(f"Searching for '{query}' in '{location}'...")
        results = search_engine.search(query, location=location)
        
        lawyers = results.get("lawyers", [])
        print(f"Found {len(lawyers)} lawyers in 서울")
        
        # Verify
        seoul_lawyers = [l for l in lawyers if "서울" in l.get("location", "")]
        print(f"Verified 서울 lawyers: {len(seoul_lawyers)}")
        
        for l in lawyers[:3]:
            print(f"- {l['name']} ({l.get('location')})")
            
    except Exception as e:
        print(f"Error during search: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_location_filter()

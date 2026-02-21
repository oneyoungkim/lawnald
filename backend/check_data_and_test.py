
import json
import sys
import os
import traceback

# Add backend to sys.path
sys.path.append(os.path.join(os.path.dirname(__file__)))

from search import search_engine
from data import LAWYERS_DB

def check_data_integrity():
    print("Checking LAWYERS_DB integrity...")
    issues = []
    for i, lawyer in enumerate(LAWYERS_DB):
        loc = lawyer.get("location")
        if not isinstance(loc, str):
            issues.append(f"Lawyer {i} ({lawyer.get('name')}) has invalid location: {loc} (type: {type(loc)})")
            
    if issues:
        print(f"Found {len(issues)} data issues:")
        for issue in issues[:10]:
            print(issue)
        if len(issues) > 10:
            print("...")
    else:
        print("Data integrity check passed: All lawyers have string locations.")

def test_location_search():
    print("\nTesting Search with Location Filter...")
    try:
        # Force refresh to ensure we have data loaded
        # Note: If refresh_index() is needed, uncomment next line
        search_engine.refresh_index() 
        
        query = "이혼"
        location = "서울"
        
        print(f"Searching query='{query}', location='{location}'")
        results = search_engine.search(query, location=location)
        
        lawyers = results.get("lawyers", [])
        print(f"Search returned {len(lawyers)} lawyers.")
        
        # Check if any results are NOT satisfying filter
        invalid_results = [l for l in lawyers if location not in l.get("location", "")]
        if invalid_results:
            print(f"ERROR: Found {len(invalid_results)} lawyers that do not match location '{location}':")
            for l in invalid_results[:3]:
                print(f"- {l['name']} ({l.get('location')})")
        else:
            print("SUCCESS: All results match location filter.")
            
    except Exception as e:
        print("CRITICAL ERROR during search:")
        traceback.print_exc()

if __name__ == "__main__":
    # PATCH LAWYERS_DB for faster testing
    import search
    original_db = search.LAWYERS_DB
    subset_db = original_db[:10]
    
    # Inject BAD DATA: Lawyer with None list fields
    bad_lawyer_1 = subset_db[0].copy()
    bad_lawyer_1["id"] = "bad-lawyer-tags"
    bad_lawyer_1["name"] = "Bad Tags Lawyer"
    bad_lawyer_1["careerTags"] = None # Potential crash: 'in None'
    bad_lawyer_1["location"] = "서울"
    
    bad_lawyer_2 = subset_db[1].copy()
    bad_lawyer_2["id"] = "bad-lawyer-content"
    bad_lawyer_2["name"] = "Bad Content Lawyer"
    bad_lawyer_2["content_items"] = None # Potential crash: iteration
    
    bad_lawyer_3 = subset_db[2].copy()
    bad_lawyer_3["id"] = "bad-lawyer-expertise"
    bad_lawyer_3["name"] = "Bad Expertise Lawyer"
    bad_lawyer_3["expertise"] = None # Potential crash: set(None)
    
    subset_db.extend([bad_lawyer_1, bad_lawyer_2, bad_lawyer_3])
    
    search.LAWYERS_DB = subset_db
    print(f"Patched LAWYERS_DB size: {len(search.LAWYERS_DB)} (with invalid list entries)")

    check_data_integrity()
    
    print("\nTesting Search WITHOUT filters (Initial Load)...")
    try:
        search_engine.refresh_index() # Need to refresh since we added new IDs
        results = search_engine.search("이혼")
        print(f"Search successful. Found {len(results.get('lawyers', []))} lawyers.")
    except Exception as e:
        print(f"CRITICAL ERROR during initial search: {e}")
        traceback.print_exc()

    # Skip specific location test for now, focus on this crash
    pass

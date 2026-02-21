
import sys
import os
import json
from search import SearchEngine

# Mock OpenAI client to avoid actual API calls if possible, or just use the real one if we want to test prompt.
# Let's use real one to test the prompt effectiveness.

def test_analysis():
    print("Initializing SearchEngine...")
    try:
        engine = SearchEngine()
        
        query = "이혼하고 싶은데 남편이 재산을 숨기고 있어요. 아이 양육권도 가져오고 싶습니다."
        print(f"Testing query: {query}")
        
        # We need to force embedding generation or load it. 
        # But analyze_query uses LLM directly, so it should work even without embeddings if we mock the search part?
        # search() calls analyze_query() first.
        # But search() requires embeddings to be loaded to return results.
        # If no embeddings, it returns empty list but MIGHT return analysis?
        # let's check search code.
        # if len(self.corpus_embeddings) == 0: return ... "데이터가 없습니다."
        # So we need embeddings.
        
        # Let's just call analyze_query directly to test the prompt!
        print("Calling analyze_query directly...")
        analysis = engine.analyze_query(query)
        print("Analysis result:")
        print(json.dumps(analysis, indent=2, ensure_ascii=False))
        
        required_fields = ["category", "core_risk", "time_strategy", "urgency"]
        missing = [f for f in required_fields if f not in analysis]
        
        if missing:
            print(f"FAILED: Missing fields: {missing}")
        else:
            print("SUCCESS: All new fields present.")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_analysis()

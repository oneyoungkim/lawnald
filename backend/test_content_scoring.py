
import sys
import os
import json
# Add current directory to path so we can import modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from search import search_engine

# 1 Test Scenario (Family Law) to check content scoring impact
scenarios = {
    "1. 외도 이혼 (가사 콘텐츠 보유 변호사 우대 확인)": "남편이 직장 동료와 부정행위를 저질렀습니다. 증거로 카톡 대화와 모텔 결제 내역이 있습니다. 이혼하고 위자료를 받고 싶습니다.",
}

def run_tests():
    output = []
    output.append("=== Lawnald API Content Scoring Verification ===\n")
    
    for title, query in scenarios.items():
        output.append(f"Scenario: {title}")
        output.append(f"Query: {query[:50]}...")
        
        try:
            result = search_engine.search(query, top_k=10)
            
            output.append(f"-> Analysis: {result['analysis']}")
            output.append("-" * 100)
            output.append(f"{'Rank':<4} {'Name':<10} {'Score':<8} {'Content':<35} {'Expertise'}")
            output.append("-" * 100)
            
            for i, lawyer in enumerate(result['lawyers']):
                match_score = f"{lawyer['matchScore']:.4f}"
                # Get first 30 chars of content highlight
                content = lawyer.get('content_highlights', 'None')
                expertise = ", ".join(lawyer['expertise'])
                output.append(f"{i+1:<4} {lawyer['name']:<10} {match_score:<8} {content:<35} {expertise}")
                
            output.append("\n" + "="*80 + "\n")
            
        except Exception as e:
            output.append(f"ERROR: {e}\n")

    with open("test_content_result.txt", "w", encoding="utf-8") as f:
        f.write("\n".join(output))
    print("Test finished. Check test_content_result.txt")

if __name__ == "__main__":
    run_tests()

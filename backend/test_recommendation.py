
import sys
import os
import json
# Add current directory to path so we can import modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from search import search_engine

# Initialize search engine (load cache)
try:
    search_engine.load_index()
except Exception as e:
    print(f"Failed to load index: {e}")

# 5 Test Scenarios
scenarios = {
    "1. 외도 이혼": "남편이 직장 동료와 부정행위를 저질렀습니다. 증거로 카톡 대화와 모텔 결제 내역이 있습니다. 이혼하고 위자료를 받고 싶습니다. 재산분할도 중요합니다.",
    "2. 양육권 분쟁": "아내가 아이를 데리고 집을 나갔습니다. 저는 아이를 제가 키우고 싶은데, 아내는 절대 안 된다고 합니다. 제가 경제 능력이 더 좋은데 양육권을 가져올 수 있을까요?",
    "3. 부당해고": "회사에서 갑자기 내일부터 나오지 말라고 합니다. 해고 예고 수당도 안 주고 사유도 설명해주지 않았습니다. 억울합니다.",
    "4. 음주운전": "회식 후 대리를 불렀는데 안 잡혀서 짧은 거리를 운전하다가 단속되었습니다. 혈중알코올농도 0.09% 나왔고 초범인데 면허 취소되나요?",
    "5. 전세사기 (형사/부동산)": "빌라 전세 계약을 했는데 집주인이 연락 두절입니다. 알고보니 깡통전세였고 보증금을 돌려받지 못할 것 같습니다. 고소하고 싶습니다."
}

def run_tests():
    output = []
    output.append("=== Lawnald API Logic Verification ===\n")
    
    for title, query in scenarios.items():
        output.append(f"Scenario: {title}")
        output.append(f"Query: {query[:50]}...")
        
        try:
            result = search_engine.search(query, top_k=5)
            
            output.append(f"-> Analysis: {result['analysis']}")
            if 'analysis_details' in result:
                ad = result['analysis_details']
                output.append(f"   [Details] Nature: {ad.get('case_nature')}")
                output.append(f"   [Details] Procedure: {ad.get('procedure')}")
                output.append(f"   [Details] Necessity: {ad.get('necessity_score')}%")
                output.append(f"   [Details] Cost: {ad.get('cost_range')}")
            output.append("-" * 80)
            output.append(f"{'Rank':<4} {'Name':<10} {'Score':<8} {'Content':<20} {'Expertise'}")
            output.append("-" * 80)
            
            for i, lawyer in enumerate(result['lawyers']):
                match_score = f"{lawyer['matchScore']:.4f}"
                content = lawyer.get('content_highlights', '')[:20]
                expertise = ", ".join(lawyer['expertise'])
                output.append(f"{i+1:<4} {lawyer['name']:<10} {match_score:<8} {content:<20} {expertise}")
                
            output.append("\n" + "="*80 + "\n")
            
        except Exception as e:
            output.append(f"ERROR: {e}\n")

    with open("test_result.txt", "w", encoding="utf-8") as f:
        f.write("\n".join(output))
    print("Test finished. Check test_result.txt")

if __name__ == "__main__":
    run_tests()

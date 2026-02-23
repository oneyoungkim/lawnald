# pyright: reportGeneralTypeIssues=false, reportMissingImports=false, reportMissingModuleSource=false
# pyre-ignore-all-errors
from dotenv import load_dotenv
load_dotenv()
from openai import OpenAI
import json

client = OpenAI()

# Test 1: o1 model with legal query
print("=== Test o1 model ===")
try:
    r = client.chat.completions.create(
        model="o1",
        messages=[
            {"role": "developer", "content": "Reply ONLY with valid JSON: {\"status\": \"ok\"}"},
            {"role": "user", "content": "이혼 소송을 준비하고 있습니다"}
        ],
        max_completion_tokens=500
    )
    content = r.choices[0].message.content
    print(f"o1 raw response ({len(content)} chars): {content[:200]}")
    print(f"Usage: {r.usage}")
except Exception as e:
    print(f"o1 FAILED: {e}")

# Test 2: gpt-4o-mini with the same query  
print("\n=== Test gpt-4o-mini ===")
try:
    r2 = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": "Reply ONLY with valid JSON: {\"status\": \"ok\", \"one_line_summary\": \"test\"}"},
            {"role": "user", "content": "이혼 소송을 준비하고 있습니다"}
        ],
        max_tokens=500
    )
    content2 = r2.choices[0].message.content
    print(f"gpt-4o-mini response ({len(content2)} chars): {content2[:300]}")
except Exception as e:
    print(f"gpt-4o-mini FAILED: {e}")

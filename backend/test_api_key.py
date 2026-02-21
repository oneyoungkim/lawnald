"""
OpenAI API Key 테스트 스크립트
사용법: OPENAI_API_KEY 환경변수를 설정한 후 이 스크립트를 실행하세요.
"""

import os
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

API_KEY = os.getenv("OPENAI_API_KEY")

def test_key(key, name):
    if not key:
        print(f"[{name}] No key provided.")
        return False
    
    print(f"[{name}] Testing key starting with {key[:15]}...")
    client = OpenAI(api_key=key)
    try:
        # Simple cheap call
        response = client.embeddings.create(input=["test"], model="text-embedding-3-small")
        print(f"[{name}] Success!")
        return True
    except Exception as e:
        print(f"[{name}] Failed: {e}")
        return False

print("--- Testing API Keys ---")
result = test_key(API_KEY, "Environment Variable")

if result:
    print("\n✅ API Key is valid.")
else:
    print("\n❌ API Key failed. Check OPENAI_API_KEY in .env file.")

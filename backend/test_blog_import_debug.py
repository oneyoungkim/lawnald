import os
from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))
load_dotenv()
print(f"KEY loaded: {bool(os.getenv('OPENAI_API_KEY'))}")

import traceback, asyncio
from routers.crawler import import_naver_blog, BlogImportRequest

async def test():
    req = BlogImportRequest(url='https://blog.naver.com/jdnlaw/224181159021')
    result = await import_naver_blog(req)
    return result

try:
    result = asyncio.run(test())
    print(f"SUCCESS: title={result.get('title', '?')}")
    print(f"Keys: {list(result.keys())}")
except Exception as e:
    print(f"ERROR: {type(e).__name__}: {e}")
    traceback.print_exc()

"""Quick check: how many lawyers are in Supabase?"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".env"))
import os
from supabase import create_client

url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_KEY")
sb = create_client(url, key)

result = sb.table("lawyers").select("id, is_mock, verified").execute()
total = len(result.data)
mock_count = len([r for r in result.data if r["is_mock"]])
real_count = len([r for r in result.data if not r["is_mock"]])
verified = len([r for r in result.data if r["verified"]])

print(f"Total: {total}")
print(f"Mock: {mock_count}")
print(f"Real: {real_count}")
print(f"Verified: {verified}")

if total > 0:
    print("--- Real Lawyers ---")
    for r in result.data:
        if not r["is_mock"]:
            lid = r["id"]
            v = r["verified"]
            print(f"  {lid} (verified={v})")
else:
    print("Table is empty - server may not have synced yet")

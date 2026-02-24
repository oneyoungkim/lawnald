"""Test Supabase Storage upload"""
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "backend"))
from dotenv import load_dotenv  # type: ignore
load_dotenv()

# Force re-init
import supabase_client  # type: ignore
supabase_client._initialized = False
supabase_client._supabase_client = None

from storage_utils import upload_and_get_url  # type: ignore

url = upload_and_get_url("licenses", "test_upload.txt", b"Hello Supabase Storage!", "text/plain")
print(f"Upload URL: {url}")

if url:
    print("SUCCESS - Storage working!")
else:
    print("FAILED - Check RLS policies")

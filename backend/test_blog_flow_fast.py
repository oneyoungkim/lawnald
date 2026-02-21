
import sys
from unittest.mock import MagicMock

# 1. Mock the search module to prevent embedding generation
mock_search = MagicMock()
sys.modules["backend.search"] = mock_search
sys.modules["search"] = mock_search

# 2. Mock other modules if they trigger slow startups
# sys.modules["backend.chat"] = MagicMock()
# sys.modules["chat"] = MagicMock()

# Now import main
try:
    from main import app, LAWYERS_DB
except ImportError:
    # Handle path issues if running from backend dir
    import os
    sys.path.append(os.getcwd())
    from main import app, LAWYERS_DB

from fastapi.testclient import TestClient

client = TestClient(app)

def test_blog_flow_fast():
    print("Testing Blog Flow (Fast)...", flush=True)
    
    # Check 1: Data Generation (Lawyers should be loaded from data.py)
    # Since we mocked search, it won't load lawyers from JSON via search.
    # main.py imports LAWYERS_DB from data.
    # We must ensure LAWYERS_DB matches what we expect (with slugs).
    
    lawyer = LAWYERS_DB[0]
    print(f"Checking Lawyer: {lawyer['name']} ({lawyer['id']})", flush=True)
    
    # 3. Check for Blog Posts with Slugs
    # Since we deleted lawyers_db.json, main.py should use the fresh list from data.py
    
    blog_posts = [item for item in lawyer["content_items"] if item["type"] in ["blog", "column", "case"]]
    
    if not blog_posts:
        # Try to find one that has posts
        for l in LAWYERS_DB:
            posts = [item for item in l["content_items"] if item["type"] in ["blog", "column", "case"]]
            if posts:
                lawyer = l
                blog_posts = posts
                print(f"Switched to Lawyer: {lawyer['name']} ({lawyer['id']})", flush=True)
                break
    
    if not blog_posts:
        print("ERROR: No blog posts found in generated data.", flush=True)
        # Verify data.py logic worked?
        return

    post = blog_posts[0]
    print(f"Found Post: {post.get('title')}", flush=True)
    print(f"Slug: {post.get('slug')}", flush=True)
    
    assert post.get("slug"), f"Slug is missing in post: {post}"
    
    # 4. Test API Endpoints
    print("\nTesting GET /api/public/lawyers...", flush=True)
    res = client.get("/api/public/lawyers")
    assert res.status_code == 200
    public_lawyers = res.json()
    assert len(public_lawyers) > 0
    
    l_entry = next((l for l in public_lawyers if l["id"] == lawyer["id"]), None)
    assert l_entry
    assert "content_items" in l_entry
    
    print("\nTesting GET /api/lawyers/{id}/blog...", flush=True)
    res = client.get(f"/api/lawyers/{lawyer['id']}/blog")
    assert res.status_code == 200
    posts = res.json()
    assert len(posts) > 0
    assert posts[0]["slug"] == post["slug"]

    print("\nTesting GET /api/lawyers/{id}/blog/{slug}...", flush=True)
    slug = post["slug"]
    res = client.get(f"/api/lawyers/{lawyer['id']}/blog/{slug}")
    assert res.status_code == 200
    detail = res.json()
    assert detail["title"] == post["title"]
    
    print("\nALL FAST CHECKS PASSED!", flush=True)

if __name__ == "__main__":
    test_blog_flow_fast()

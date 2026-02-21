
from fastapi.testclient import TestClient
from main import app, LAWYERS_DB

client = TestClient(app)

def test_blog_flow():
    print("Testing Blog Flow...", flush=True)
    
    # 1. Check Data Generation
    lawyer = LAWYERS_DB[0]
    print(f"Checking Lawyer: {lawyer['name']} ({lawyer['id']})", flush=True)
    
    # Ensure content items have slugs
    blog_posts = [item for item in lawyer["content_items"] if item["type"] in ["blog", "column", "case"]]
    if not blog_posts:
        print("WARNING: No blog posts found for this lawyer. Identifying a lawyer with posts...")
        for l in LAWYERS_DB:
            if any(item["type"] in ["blog", "column", "case"] for item in l["content_items"]):
                lawyer = l
                blog_posts = [item for item in lawyer["content_items"] if item["type"] in ["blog", "column", "case"]]
                print(f"Switched to Lawyer: {lawyer['name']} ({lawyer['id']})")
                break
    
    if not blog_posts:
        print("ERROR: No blog posts generated at all.")
        return

    post = blog_posts[0]
    print(f"Found Post: {post}")
    print(f"Slug: {post.get('slug')}")
    print(f"SEO Title: {post.get('seo_title')}")
    
    assert post.get("slug"), f"Slug is missing in post: {post}"
    assert post.get("seo_title"), "SEO Title is missing"

    # 2. Test Public Lawyers List (Sitemap)
    print("\nTesting GET /api/public/lawyers (Sitemap Data)...")
    res = client.get("/api/public/lawyers")
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, list)
    assert len(data) > 0
    lawyer_entry = next((l for l in data if l["id"] == lawyer["id"]), None)
    assert lawyer_entry, "Lawyer not found in public list"
    assert "content_items" in lawyer_entry
    # Check if content item has slug
    sitemap_post = next((p for p in lawyer_entry["content_items"] if p["id"] == post["id"]), None)
    assert sitemap_post, "Post not found in sitemap data"
    assert "slug" in sitemap_post
    print("Sitemap data looks good.")

    # 3. Test Blog List API
    print(f"\nTesting GET /api/lawyers/{lawyer['id']}/blog...")
    res = client.get(f"/api/lawyers/{lawyer['id']}/blog")
    assert res.status_code == 200
    posts_res = res.json()
    assert len(posts_res) > 0
    assert posts_res[0]["slug"] == post["slug"]
    print("Blog list API looks good.")

    # 4. Test Blog Detail API
    slug = post["slug"]
    print(f"\nTesting GET /api/lawyers/{lawyer['id']}/blog/{slug}...")
    res = client.get(f"/api/lawyers/{lawyer['id']}/blog/{slug}")
    assert res.status_code == 200
    detail = res.json()
    assert detail["title"] == post["title"]
    assert detail["content"] == post["content"]
    print("Blog detail API looks good.")

    print("\nALL TESTS PASSED!")

if __name__ == "__main__":
    test_blog_flow()

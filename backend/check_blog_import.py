import requests
import json
import sys

def test_blog_import():
    url = "http://localhost:8000/api/blog/import"
    
    # Example Naver Blog URL (Replace with a real one for actual testing)
    if len(sys.argv) > 1:
        target_blog = sys.argv[1]
    else:
        target_blog = input("Enter Naver Blog URL (e.g., https://blog.naver.com/id/1234): ").strip()
    
    if not target_blog:
        print("URL is required.")
        return

    payload = {
        "url": target_blog
    }
    
    print(f"\nSending request to {url}...")
    print(f"Payload: {json.dumps(payload, indent=2)}")
    
    try:
        response = requests.post(url, json=payload, timeout=300)
        
        if response.status_code == 200:
            data = response.json()
            print("\n[Import Success]")
            print("-" * 30)
            print(f"Title: {data.get('title')}")
            print(f"Category: {data.get('category')}")
            print(f"Keyword: {data.get('keyword')}")
            print(f"Image: {data.get('cover_image_url')}")
            print(f"Content Length: {len(data.get('content', ''))} chars")
            print("-" * 30)
            
            # Save to file
            with open("imported_blog.md", "w", encoding="utf-8") as f:
                f.write(f"# {data.get('title')}\n\n")
                f.write(f"![Cover]({data.get('cover_image_url')})\n\n")
                f.write(data.get('content', ''))
            print("Content saved to 'imported_blog.md'")
            
        else:
            print(f"\n[ERROR] Status Code: {response.status_code}")
            print(response.text)
            
    except Exception as e:
        print(f"\n[EXCEPTION] {e}")

if __name__ == "__main__":
    test_blog_import()


import sys
import os
from unittest.mock import MagicMock

# Mock dependencies
sys.modules["backend.search"] = MagicMock()
sys.modules["search"] = MagicMock()

# Import modules to test
try:
    # Try importing as if we are in the package
    from seo import seo_generator, pii_masker
    from validators import content_validator
except ImportError:
    # If failing, try adding parent directory to path to support 'backend.seo'
    # Or just add current directory to import directly
    import os
    sys.path.append(os.getcwd())
    try:
        from seo import seo_generator, pii_masker
        from validators import content_validator
    except ImportError:
        # Final attempt: add parent of backend to path
        sys.path.append(os.path.dirname(os.getcwd()))
        from backend.seo import seo_generator, pii_masker
        from backend.validators import content_validator

def test_validators():
    print("\n--- Testing Content Validators ---", flush=True)
    
    # 1. Length Check
    short_content = "Too short"
    res = content_validator.validate_length(short_content, min_length=100)
    print(f"Short content valid: {res['valid']} (Msg: {res['message']})", flush=True)
    assert not res['valid']
    
    long_content = "This is a longer content " * 20
    res = content_validator.validate_length(long_content, min_length=100)
    print(f"Long content valid: {res['valid']}", flush=True)
    assert res['valid']

    # 2. Keyword Density
    content_kw = "divorce divorce divorce divorce divorce normal text..."
    res = content_validator.check_keyword_density(content_kw, ["divorce"], max_density=0.1)
    print(f"High density check: {res['valid']} (Warnings: {res['warnings']})", flush=True)
    assert not res['valid']
    
    res = content_validator.check_keyword_density(long_content, ["divorce"], max_density=0.1)
    print(f"Low density check: {res['valid']}", flush=True)
    assert res['valid']

def test_seo_generation():
    print("\n--- Testing SEO Generation ---", flush=True)
    
    # 1. Schema.org
    article = {
        "title": "Title",
        "seo_title": "SEO Title",
        "slug": "slug-123",
        "date": "2025-01-01",
        "seo_description": "Desc"
    }
    lawyer = {
        "id": "lawyer-1",
        "name": "Lawyer Name",
        "imageUrl": "http://img.com"
    }
    
    schema_json = seo_generator.generate_schema_org(article, lawyer)
    print(f"Schema JSON: {schema_json[:100]}...", flush=True)
    assert "@context" in schema_json
    assert "BlogPosting" in schema_json
    
    # 2. Keywords
    text = "이혼 소송 절차 양육권 위자료 이혼 소송 절차"
    kws = seo_generator.extract_keywords(text)
    print(f"Extracted Keywords: {kws}", flush=True)
    assert "이혼" in kws or "소송" in kws

    # 3. Open Graph
    og = seo_generator.generate_open_graph_tags(article, lawyer)
    print(f"OG Tags: {og}", flush=True)
    assert og["og:title"] == "SEO Title"

if __name__ == "__main__":
    test_validators()
    test_seo_generation()

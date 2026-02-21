
import requests
import sys

def test_upload():
    url = "http://localhost:8001/api/cases/upload"
    
    # Create a dummy PDF file content (minimal valid header)
    pdf_content = b"%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n2 0 obj\n<<\n/Type /Pages\n/Kids [3 0 R]\n/Count 1\n>>\nendobj\n3 0 obj\n<<\n/Type /Page\n/MediaBox [0 0 595 842]\n>>\nendobj\ntrailer\n<<\n/Root 1 0 R\n>>\n%%EOF"
    
    files = {'file': ('test.pdf', pdf_content, 'application/pdf')}
    
    try:
        print(f"Sending request to {url}...")
        response = requests.post(url, files=files, timeout=10)
        
        print(f"Status Code: {response.status_code}")
        if response.status_code == 200:
            print("Response JSON:")
            import json
            print(json.dumps(response.json(), indent=2, ensure_ascii=False))
        else:
            print(f"Error: {response.text}")
            
    except requests.exceptions.ConnectionError:
        print("Connection Refused: Server is not running.")
    except Exception as e:
        print(f"Exception: {e}")

if __name__ == "__main__":
    test_upload()

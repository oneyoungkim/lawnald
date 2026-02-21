import requests
import json

BASE_URL = "http://localhost:8000"
LAWYER_ID = "lawyer_1" # Assuming this lawyer exists in mock data or we can use another one.
# Check main.py for available lawyers. unique-id-1 is typically used.
# Let's check main.py content or just use a known one. 
# Re-reading main.py showed LAWYERS_DB is initialized. 
# Let's try to get the list of lawyers first to get a valid ID.

def test_leads_flow():
    print("1. Fetching lawyers to get a valid ID...")
    try:
        res = requests.get(f"{BASE_URL}/api/recommend?q=test")
        if res.status_code != 200:
            print("Failed to fetch lawyers.")
            return

        data = res.json()
        lawyers = data.get("lawyers", data) if isinstance(data, dict) else data
        if not lawyers:
            print("No lawyers found.")
            return

        target_lawyer = lawyers[0]
        lawyer_id = target_lawyer["id"]
        print(f"Targeting lawyer: {lawyer_id} ({target_lawyer['name']})")

        print("\n2. Creating a new lead...")
        lead_payload = {
            "case_summary": "Test Case: I need help with a divorce.",
            "contact_type": "phone"
        }
        res = requests.post(f"{BASE_URL}/api/lawyers/{lawyer_id}/leads", json=lead_payload)
        print(f"Status: {res.status_code}")
        print(f"Response: {res.json()}")
        
        if res.status_code != 200:
            print("Failed to create lead.")
            return

        print("\n3. Fetching leads for the lawyer...")
        res = requests.get(f"{BASE_URL}/api/lawyers/{lawyer_id}/leads")
        print(f"Status: {res.status_code}")
        leads = res.json()
        print(f"Leads found: {len(leads)}")
        
        found = False
        for lead in leads:
            print(f"- [{lead['timestamp']}] {lead['contact_type']}: {lead['case_summary']}")
            if lead['case_summary'] == lead_payload['case_summary']:
                found = True
        
        if found:
            print("\nSUCCESS: Lead verification passed!")
        else:
            print("\nFAILURE: Created lead not found.")

    except Exception as e:
        print(f"An error occurred: {e}")

if __name__ == "__main__":
    test_leads_flow()

import sys
import os
import time
import json

# Add project root and backend to path to satisfy all imports
root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(root_dir)
sys.path.append(os.path.join(root_dir, "backend"))

from backend.chat import presence_manager
from backend.search import search

def test_presence_system():
    lawyer_id = "lawyer1@example.com"
    query = "이혼"
    
    print(f"--- Testing Presence System for {lawyer_id} ---")

    # 1. Check initial status (should be offline)
    initial_status = presence_manager.get_status(lawyer_id)
    print(f"Initial Status: {initial_status}")
    if initial_status != "offline":
        print("❌ Expected initial status to be offline")
        return

    # 2. Perform Search (Lawyer should be offline in results)
    print("\n[Search 1] Searching while offline...")
    try:
        results_offline = search(query)
        lawyer_res_offline = next((l for l in results_offline if l["id"] == lawyer_id), None)
        if lawyer_res_offline:
            print(f"Lawyer found. isOnline: {lawyer_res_offline.get('isOnline')}")
            print(f"Match Score: {lawyer_res_offline['matchScore']}")
            if lawyer_res_offline.get('isOnline'):
                 print("❌ Expected isOnline to be False")
        else:
            print("Lawyer not found in search results (might be low score)")
    except Exception as e:
        print(f"Error during search: {e}")

    # 3. Update Heartbeat (Simulate Online)
    print(f"\n[Action] Updating heartbeat for {lawyer_id}...")
    presence_manager.update_heartbeat(lawyer_id)
    
    current_status = presence_manager.get_status(lawyer_id)
    print(f"Current Status: {current_status}")
    if current_status != "online":
         print("❌ Expected status to be online")
         return

    # 4. Perform Search (Lawyer should be ONLINE and Boosted)
    print("\n[Search 2] Searching while ONLINE...")
    try:
        results_online = search(query)
        lawyer_res_online = next((l for l in results_online if l["id"] == lawyer_id), None)
        if lawyer_res_online:
            print(f"Lawyer found. isOnline: {lawyer_res_online.get('isOnline')}")
            print(f"Match Score: {lawyer_res_online['matchScore']}")
            
            if not lawyer_res_online.get('isOnline'):
                 print("❌ Expected isOnline to be True")
            
            # Check for score boost if we have offline result
            if lawyer_res_offline:
                print(f"Score Delta: {lawyer_res_online['matchScore']} vs {lawyer_res_offline['matchScore']}")
                if lawyer_res_online['matchScore'] > lawyer_res_offline['matchScore']:
                     print("✅ Score Boost Verified")
                else:
                     print("❌ Score did not increase")
        else:
            print("Lawyer not found in search results")
    
    except Exception as e:
        print(f"Error during search: {e}")

if __name__ == "__main__":
    test_presence_system()

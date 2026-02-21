import sys
import os
import time

# Add project root and backend to path
root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(root_dir)
sys.path.append(os.path.join(root_dir, "backend"))

from backend.chat import presence_manager

def test_presence_logic():
    print("Testing PresenceManager...")
    lawyer_id = "test_lawyer"
    
    # Initial
    assert presence_manager.get_status(lawyer_id) == "offline"
    print("1. Initial offline: OK")
    
    # Update
    presence_manager.update_heartbeat(lawyer_id)
    assert presence_manager.get_status(lawyer_id) == "online"
    print("2. Updated online: OK")

if __name__ == "__main__":
    test_presence_logic()

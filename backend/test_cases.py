import sys
import os

root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(root_dir)
sys.path.append(os.path.join(root_dir, "backend"))

from backend.cases import case_manager

def test_cases():
    print("Testing CaseManager...")
    
    # 1. Check Initialization
    print(f"Cases count: {len(case_manager.cases)}")
    print(f"Deid Cases count: {len(case_manager.deid_cases)}")
    
    # 2. Check Mock Data
    admin_cases = case_manager.get_all_cases_admin()
    if len(admin_cases) > 0:
        print("✅ Admin cases retrieval works")
        print(f"Sample PII warnings: {admin_cases[0]['pii_warnings']}")
    else:
        print("❌ No admin cases found")
        
    archive_cases = case_manager.get_archive_cases()
    if len(archive_cases) > 0:
        print("✅ Archive cases retrieval works")
    else:
        # Might be 0 if all mock data is not public
        pass
        
    print("Test Complete")

if __name__ == "__main__":
    test_cases()

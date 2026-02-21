
import sys
import os

# Add local directory to path just in case, mimicking main.py situation if run from backend/
sys.path.append(os.getcwd())

print(f"Testing import of CaseParser from {os.getcwd()}")
try:
    from backend.case_parser_v2 import case_parser
    print("Success: from backend.case_parser_v2")
except ImportError as e:
    print(f"Failed: backend.case_parser_v2: {e}")
    try:
        from case_parser_v2 import case_parser
        print("Success: from case_parser_v2")
    except ImportError as e2:
        print(f"Failed: case_parser_v2: {e2}")

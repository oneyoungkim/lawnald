
import json
import os
import sys

# Direct JSON load
DB_FILE = "lawyers_db.json"
try:
    with open(DB_FILE, "r", encoding="utf-8") as f:
        LAWYERS_DB = json.load(f)
        print(f"Loaded {len(LAWYERS_DB)} lawyers from {DB_FILE}")
except Exception as e:
    print(f"Error loading DB: {e}")
    sys.exit(1)

print("Checking for verified items missing 'date' field...")
issues_found = 0

for lawyer in LAWYERS_DB:
    for item in lawyer.get("content_items", []):
        if item.get("verified"):
            if "date" not in item:
                print(f"KeyError Potential! Lawyer: {lawyer['name']}, Item: {item.get('title')}, ID: {item.get('id')}")
                issues_found += 1
            elif item["date"] is None:
                print(f"None Value! Lawyer: {lawyer['name']}, Item: {item.get('title')}, ID: {item.get('id')}")
                issues_found += 1

if issues_found == 0:
    print("No issues found. All verified items have a date.")
else:
    print(f"Found {issues_found} problematic items.")

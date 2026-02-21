import json
import os
import sys

# Direct JSON load to verify disk persistence
DB_FILE = "lawyers_db.json"
try:
    with open(DB_FILE, "r", encoding="utf-8") as f:
        LAWYERS_DB = json.load(f)
        print(f"Loaded {len(LAWYERS_DB)} lawyers from {DB_FILE}")
except Exception as e:
    print(f"Error loading DB: {e}")
    LAWYERS_DB = []

print(f"Total lawyers: {len(LAWYERS_DB)}")

pending_count = 0
for lawyer in LAWYERS_DB:
    items = lawyer.get("content_items", [])
    p_items = [i for i in items if i.get("status") == "pending"]
    if p_items:
        print(f"Lawyer {lawyer['id']} has {len(p_items)} pending items:")
        for i in p_items:
            print(f"  - [{i.get('date', 'NoDate')}] {i.get('title')} (ID: {i.get('id')})")
        pending_count += len(p_items)

print(f"Total pending items in DB: {pending_count}")

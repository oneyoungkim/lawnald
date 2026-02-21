from backend.main import LAWYERS_DB
import json

with open('debug_output.txt', 'w', encoding='utf-8') as f:
    for l in LAWYERS_DB:
        if '김원영' in l['name']:
            f.write(json.dumps(l, indent=2, ensure_ascii=False))

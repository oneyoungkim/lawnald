import sys, json, os
sys.path.insert(0, 'backend')
from dotenv import load_dotenv
load_dotenv(os.path.join('backend', '.env'))
from supabase_client import get_supabase

sb = get_supabase()
result = sb.table('lawyers').select('*').eq('id', 'welder49264@naver.com').execute()

if result.data:
    row = result.data[0]
    data = row.get('data', {})
    print("=== Supabase Row Fields ===")
    for key in ['name', 'firm', 'phone', 'career', 'education', 'expertise',
                'introduction_short', 'introduction_long', 'imageUrl', 'cutoutImageUrl',
                'licenseImageUrl', 'location', 'gender', 'matchScore']:
        val = data.get(key, '[MISSING]')
        if isinstance(val, str) and len(val) > 100:
            val = val[:100] + '...'
        print(f"  {key}: {val}")
    print(f"\n  is_mock: {row.get('is_mock')}")
    print(f"  verified: {row.get('verified')}")
else:
    print("NOT FOUND in Supabase")

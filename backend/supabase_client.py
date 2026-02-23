"""
Supabase Client Module
- 환경변수에서 SUPABASE_URL / SUPABASE_KEY 를 읽어 클라이언트 초기화
- 환경변수 미설정 시 None 반환 → JSON 파일 폴백
"""

import os

_supabase_client = None
_initialized = False


def get_supabase():
    """
    Supabase 클라이언트를 반환합니다.
    환경변수가 설정되지 않은 경우 None을 반환하여 JSON 폴백을 사용합니다.
    """
    global _supabase_client, _initialized

    if _initialized:
        return _supabase_client

    _initialized = True

    url = os.getenv("SUPABASE_URL", "")
    # 서비스 키(secret key)를 우선 사용 — RLS 바이패스 (Storage 업로드에 필요)
    key = os.getenv("SUPABASE_SECRET_KEY", "") or os.getenv("SUPABASE_KEY", "")

    if not url or not key:
        print("⚠️ SUPABASE_URL/SUPABASE_KEY 미설정 → JSON 파일 모드로 동작")
        return None

    try:
        from supabase import create_client  # type: ignore
        _supabase_client = create_client(url, key)
        print(f"✅ Supabase 연결 성공: {url[:40]}...")
        return _supabase_client
    except Exception as e:
        print(f"❌ Supabase 연결 실패: {e} → JSON 파일 모드로 폴백")
        _supabase_client = None
        return None

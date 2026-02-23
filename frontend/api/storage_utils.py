"""
Supabase Storage Utility Module
- 파일을 Supabase Storage 버킷에 업로드
- 공개 URL 반환
- Supabase 미연결 시 로컬 파일시스템 폴백
"""

import os


def upload_file(bucket: str, path: str, file_bytes: bytes, content_type: str = "application/octet-stream") -> bool:
    """
    Supabase Storage에 파일을 업로드합니다.
    
    Args:
        bucket: 버킷 이름 (licenses, cases, photos)
        path: 버킷 내 파일 경로 (예: "lawyer123/license.png")
        file_bytes: 파일 바이트 데이터
        content_type: MIME 타입
    
    Returns:
        True if uploaded to Supabase, False if fallback to local
    """
    try:
        from supabase_client import get_supabase  # type: ignore
        sb = get_supabase()
        if sb is None:
            return False
        
        # upsert=True로 같은 경로에 덮어쓰기 허용
        sb.storage.from_(bucket).upload(
            path=path,
            file=file_bytes,
            file_options={
                "content-type": content_type,
                "upsert": "true"
            }
        )
        print(f"✅ Supabase Storage 업로드: {bucket}/{path}")
        return True
    except Exception as e:
        print(f"⚠️ Supabase Storage 업로드 실패: {e}")
        return False


def get_public_url(bucket: str, path: str) -> str:
    """
    Supabase Storage의 공개 URL을 반환합니다.
    """
    try:
        from supabase_client import get_supabase  # type: ignore
        sb = get_supabase()
        if sb is None:
            return ""
        
        result = sb.storage.from_(bucket).get_public_url(path)
        return result
    except Exception as e:
        print(f"⚠️ Supabase Storage URL 생성 실패: {e}")
        return ""


def upload_and_get_url(bucket: str, path: str, file_bytes: bytes, content_type: str = "application/octet-stream") -> str:
    """
    파일 업로드 후 공개 URL을 반환하는 편의 함수.
    실패 시 빈 문자열 반환.
    """
    success = upload_file(bucket, path, file_bytes, content_type)
    if success:
        return get_public_url(bucket, path)
    return ""
